import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders, performSecurityCheck, errorResponse, successResponse } from "../_shared/security.ts";
import { logAdminAction } from "../_shared/audit.ts";

interface BulkDuesRequest {
  contribution_type_id: string;
  due_month: string; // YYYY-MM-DD format
  amount: number;
  member_ids: string[] | 'all_active';
  notes?: string;
}

interface BulkDuesResult {
  success: boolean;
  created: number;
  skipped: number;
  failed: number;
  details: {
    created_ids: string[];
    skipped_members: { member_id: string; reason: string }[];
    failed_members: { member_id: string; error: string }[];
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Security check - require admin role
    const securityCheck = await performSecurityCheck(req, {
      requireAuth: true,
      requireTenant: true,
      allowedRoles: ['admin'],
      checkSubscription: true,
      rateLimitType: 'api'
    });

    if (!securityCheck.success) {
      return errorResponse(securityCheck.error || 'Unauthorized', securityCheck.status || 403);
    }

    const { context, supabase } = securityCheck;
    const tenantId = context!.tenantId!;
    const userId = context!.userId;

    const body: BulkDuesRequest = await req.json();
    const { contribution_type_id, due_month, amount, member_ids, notes } = body;

    // Validate required fields
    if (!contribution_type_id || !due_month || amount === undefined || !member_ids) {
      return errorResponse('Missing required fields: contribution_type_id, due_month, amount, member_ids', 400);
    }

    if (amount <= 0) {
      return errorResponse('Amount must be greater than 0', 400);
    }

    console.log(`[create-bulk-dues] Starting bulk dues creation for tenant ${tenantId}`);
    console.log(`[create-bulk-dues] Category: ${contribution_type_id}, Month: ${due_month}, Amount: ${amount}`);

    // Validate contribution type exists and belongs to tenant
    const { data: contributionType, error: ctError } = await supabase!
      .from('contribution_types')
      .select('id, name, is_active, is_fixed_amount, default_amount')
      .eq('id', contribution_type_id)
      .eq('tenant_id', tenantId)
      .single();

    if (ctError || !contributionType) {
      return errorResponse('Contribution type not found or does not belong to this tenant', 404);
    }

    if (!contributionType.is_active) {
      return errorResponse('Cannot create dues for inactive contribution type', 400);
    }

    // Get target members
    let targetMemberIds: string[] = [];

    if (member_ids === 'all_active') {
      const { data: members, error: membersError } = await supabase!
        .from('members')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('status', 'active');

      if (membersError) {
        return errorResponse('Failed to fetch members', 500);
      }

      targetMemberIds = (members || []).map(m => m.id);
    } else if (Array.isArray(member_ids)) {
      // Validate member IDs belong to tenant
      const { data: validMembers, error: validError } = await supabase!
        .from('members')
        .select('id')
        .eq('tenant_id', tenantId)
        .in('id', member_ids);

      if (validError) {
        return errorResponse('Failed to validate members', 500);
      }

      targetMemberIds = (validMembers || []).map(m => m.id);
    }

    if (targetMemberIds.length === 0) {
      return errorResponse('No valid members to create dues for', 400);
    }

    console.log(`[create-bulk-dues] Processing ${targetMemberIds.length} members`);

    // Check for existing dues to prevent duplicates
    const { data: existingDues, error: existingError } = await supabase!
      .from('dues')
      .select('member_id')
      .eq('tenant_id', tenantId)
      .eq('contribution_type_id', contribution_type_id)
      .eq('due_month', due_month)
      .in('member_id', targetMemberIds);

    if (existingError) {
      console.error('[create-bulk-dues] Error checking existing dues:', existingError);
    }

    const existingMemberIds = new Set((existingDues || []).map(d => d.member_id));

    // Get member balances for advance application
    const { data: memberBalances } = await supabase!
      .from('member_balances')
      .select('member_id, advance_balance')
      .eq('tenant_id', tenantId)
      .gt('advance_balance', 0);

    const balanceMap = new Map(
      (memberBalances || []).map(b => [b.member_id, Number(b.advance_balance)])
    );

    // Prepare result tracking
    const result: BulkDuesResult = {
      success: true,
      created: 0,
      skipped: 0,
      failed: 0,
      details: {
        created_ids: [],
        skipped_members: [],
        failed_members: []
      }
    };

    // Process in batches
    const batchSize = 50;
    const membersToProcess = targetMemberIds.filter(id => !existingMemberIds.has(id));
    
    // Track skipped members
    for (const memberId of targetMemberIds) {
      if (existingMemberIds.has(memberId)) {
        result.skipped++;
        result.details.skipped_members.push({
          member_id: memberId,
          reason: 'Due already exists for this month and category'
        });
      }
    }

    // Process members in batches
    for (let i = 0; i < membersToProcess.length; i += batchSize) {
      const batch = membersToProcess.slice(i, i + batchSize);
      
      const duesToInsert = batch.map(memberId => {
        const advanceBalance = balanceMap.get(memberId) || 0;
        const advanceToApply = Math.min(advanceBalance, amount);
        
        let status: 'unpaid' | 'partial' | 'paid' = 'unpaid';
        if (advanceToApply >= amount) {
          status = 'paid';
        } else if (advanceToApply > 0) {
          status = 'partial';
        }

        return {
          tenant_id: tenantId,
          member_id: memberId,
          contribution_type_id,
          amount,
          paid_amount: advanceToApply,
          advance_from_balance: advanceToApply,
          due_month,
          status,
          generated_at: new Date().toISOString()
        };
      });

      const { data: insertedDues, error: insertError } = await supabase!
        .from('dues')
        .insert(duesToInsert)
        .select('id, member_id, advance_from_balance');

      if (insertError) {
        console.error(`[create-bulk-dues] Batch insert error:`, insertError);
        batch.forEach(memberId => {
          result.failed++;
          result.details.failed_members.push({
            member_id: memberId,
            error: insertError.message
          });
        });
      } else if (insertedDues) {
        result.created += insertedDues.length;
        insertedDues.forEach(due => result.details.created_ids.push(due.id));

        // Update member balances for those who had advance applied
        for (const due of insertedDues) {
          const advanceApplied = Number(due.advance_from_balance) || 0;
          if (advanceApplied > 0) {
            const currentBalance = balanceMap.get(due.member_id) || 0;
            const newBalance = currentBalance - advanceApplied;
            
            await supabase!
              .from('member_balances')
              .update({ 
                advance_balance: newBalance,
                last_reconciled_at: new Date().toISOString()
              })
              .eq('tenant_id', tenantId)
              .eq('member_id', due.member_id);

            // Update local map
            balanceMap.set(due.member_id, newBalance);

            // Log the advance application
            await supabase!
              .from('payment_reconciliation_logs')
              .insert({
                tenant_id: tenantId,
                payment_id: due.id,
                member_id: due.member_id,
                action: 'ADVANCE_AUTO_APPLIED_BULK',
                details: {
                  due_id: due.id,
                  due_month,
                  advance_applied: advanceApplied,
                  previous_balance: currentBalance,
                  new_balance: newBalance,
                  applied_at: new Date().toISOString()
                }
              });
          }
        }
      }
    }

    // Log the bulk action for audit
    await logAdminAction(supabase!, {
      user_id: userId,
      tenant_id: tenantId,
      action_description: `Bulk dues creation: ${result.created} created, ${result.skipped} skipped, ${result.failed} failed`,
      entity_type: 'payment',
      entity_id: contribution_type_id,
      before_state: undefined,
      after_state: {
        contribution_type_id,
        due_month,
        amount,
        members_targeted: targetMemberIds.length,
        created: result.created,
        skipped: result.skipped,
        failed: result.failed,
        notes
      }
    });

    console.log(`[create-bulk-dues] Complete. Created: ${result.created}, Skipped: ${result.skipped}, Failed: ${result.failed}`);

    return successResponse({
      ...result,
      message: `Successfully created ${result.created} dues. ${result.skipped} skipped (already exist). ${result.failed} failed.`
    });

  } catch (error) {
    console.error('[create-bulk-dues] Error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
});
