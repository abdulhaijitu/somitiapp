import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders, performSecurityCheck, errorResponse, successResponse } from "../_shared/security.ts";
import { logAdminAction } from "../_shared/audit.ts";

interface PaymentEntry {
  member_id: string;
  amount: number;
}

interface BulkPaymentsRequest {
  contribution_type_id: string;
  payment_date: string;
  payment_method: 'offline' | 'bkash' | 'nagad' | 'rocket' | 'card' | 'other';
  reference?: string;
  notes?: string;
  payments: PaymentEntry[];
}

interface BulkPaymentsResult {
  success: boolean;
  created: number;
  skipped: number;
  failed: number;
  total_amount: number;
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
    // Security check - require admin or manager role
    const securityCheck = await performSecurityCheck(req, {
      requireAuth: true,
      requireTenant: true,
      allowedRoles: ['admin', 'manager'],
      checkSubscription: true,
      rateLimitType: 'payment'
    });

    if (!securityCheck.success) {
      return errorResponse(securityCheck.error || 'Unauthorized', securityCheck.status || 403);
    }

    const { context, supabase } = securityCheck;
    const tenantId = context!.tenantId!;
    const userId = context!.userId;

    const body: BulkPaymentsRequest = await req.json();
    const { contribution_type_id, payment_date, payment_method, reference, notes, payments } = body;

    // Validate required fields
    if (!contribution_type_id || !payment_date || !payment_method || !payments || !Array.isArray(payments)) {
      return errorResponse('Missing required fields: contribution_type_id, payment_date, payment_method, payments', 400);
    }

    if (payments.length === 0) {
      return errorResponse('No payments to process', 400);
    }

    // Validate all amounts are positive
    const invalidPayments = payments.filter(p => !p.member_id || !p.amount || p.amount <= 0);
    if (invalidPayments.length > 0) {
      return errorResponse('All payments must have valid member_id and positive amount', 400);
    }

    console.log(`[create-bulk-payments] Starting bulk payment creation for tenant ${tenantId}`);
    console.log(`[create-bulk-payments] Category: ${contribution_type_id}, Method: ${payment_method}, Entries: ${payments.length}`);

    // Validate contribution type exists and belongs to tenant
    const { data: contributionType, error: ctError } = await supabase!
      .from('contribution_types')
      .select('id, name, is_active')
      .eq('id', contribution_type_id)
      .eq('tenant_id', tenantId)
      .single();

    if (ctError || !contributionType) {
      return errorResponse('Contribution type not found or does not belong to this tenant', 404);
    }

    if (!contributionType.is_active) {
      return errorResponse('Cannot create payments for inactive contribution type', 400);
    }

    // Validate all member IDs belong to tenant
    const memberIds = payments.map(p => p.member_id);
    const { data: validMembers, error: membersError } = await supabase!
      .from('members')
      .select('id')
      .eq('tenant_id', tenantId)
      .in('id', memberIds);

    if (membersError) {
      return errorResponse('Failed to validate members', 500);
    }

    const validMemberIds = new Set((validMembers || []).map(m => m.id));

    // Prepare result tracking
    const result: BulkPaymentsResult = {
      success: true,
      created: 0,
      skipped: 0,
      failed: 0,
      total_amount: 0,
      details: {
        created_ids: [],
        skipped_members: [],
        failed_members: []
      }
    };

    // Process payments in batches
    const batchSize = 25;
    const validPayments = payments.filter(p => validMemberIds.has(p.member_id));
    const invalidMemberPayments = payments.filter(p => !validMemberIds.has(p.member_id));

    // Track invalid members
    for (const payment of invalidMemberPayments) {
      result.skipped++;
      result.details.skipped_members.push({
        member_id: payment.member_id,
        reason: 'Member not found or does not belong to this tenant'
      });
    }

    // Get period from payment date
    const paymentDateObj = new Date(payment_date);
    const periodMonth = paymentDateObj.getMonth() + 1;
    const periodYear = paymentDateObj.getFullYear();

    // Get all unpaid dues for these members to link payments
    const { data: unpaidDues } = await supabase!
      .from('dues')
      .select('id, member_id, amount, paid_amount, status, contribution_type_id')
      .eq('tenant_id', tenantId)
      .eq('contribution_type_id', contribution_type_id)
      .in('member_id', Array.from(validMemberIds))
      .neq('status', 'paid')
      .order('due_month', { ascending: true });

    // Define a type for the due record
    type DueRecord = {
      id: string;
      member_id: string;
      amount: number;
      paid_amount: number;
      status: string;
      contribution_type_id: string;
    };

    // Create a map of member_id to their oldest unpaid due
    const memberDueMap = new Map<string, DueRecord>();
    for (const due of (unpaidDues || [])) {
      if (!memberDueMap.has(due.member_id)) {
        memberDueMap.set(due.member_id, due);
      }
    }

    // Get member balances for advance tracking
    const { data: memberBalances } = await supabase!
      .from('member_balances')
      .select('member_id, advance_balance')
      .eq('tenant_id', tenantId)
      .in('member_id', Array.from(validMemberIds));

    const balanceMap = new Map(
      (memberBalances || []).map(b => [b.member_id, Number(b.advance_balance)])
    );

    // Process in batches
    for (let i = 0; i < validPayments.length; i += batchSize) {
      const batch = validPayments.slice(i, i + batchSize);
      
      const paymentsToInsert = batch.map(payment => {
        const linkedDue = memberDueMap.get(payment.member_id);
        const referenceCode = `BULK-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

        return {
          tenant_id: tenantId,
          member_id: payment.member_id,
          amount: payment.amount,
          payment_type: 'offline',
          payment_method: payment_method,
          status: 'paid',
          reference: reference || referenceCode,
          period_month: periodMonth,
          period_year: periodYear,
          payment_date: payment_date,
          notes: notes || 'Bulk payment entry',
          contribution_type_id,
          due_id: linkedDue?.id || null
        };
      });

      const { data: insertedPayments, error: insertError } = await supabase!
        .from('payments')
        .insert(paymentsToInsert)
        .select('id, member_id, amount, due_id');

      if (insertError) {
        console.error(`[create-bulk-payments] Batch insert error:`, insertError);
        batch.forEach(payment => {
          result.failed++;
          result.details.failed_members.push({
            member_id: payment.member_id,
            error: insertError.message
          });
        });
      } else if (insertedPayments) {
        result.created += insertedPayments.length;
        result.total_amount += insertedPayments.reduce((sum, p) => sum + Number(p.amount), 0);
        insertedPayments.forEach(p => result.details.created_ids.push(p.id));

        // Process each payment for reconciliation
        for (const payment of insertedPayments) {
          const paymentAmount = Number(payment.amount);
          let remainingAmount = paymentAmount;

          // If linked to a due, update it
          if (payment.due_id) {
            const linkedDue = memberDueMap.get(payment.member_id);
            if (linkedDue) {
              const dueAmount = Number(linkedDue.amount);
              const currentPaid = Number(linkedDue.paid_amount);
              const dueRemaining = dueAmount - currentPaid;
              const applyToDue = Math.min(remainingAmount, dueRemaining);

              const newPaidAmount = currentPaid + applyToDue;
              let newStatus: 'unpaid' | 'partial' | 'paid' = 'unpaid';
              if (newPaidAmount >= dueAmount) {
                newStatus = 'paid';
              } else if (newPaidAmount > 0) {
                newStatus = 'partial';
              }

              await supabase!
                .from('dues')
                .update({
                  paid_amount: newPaidAmount,
                  status: newStatus,
                  updated_at: new Date().toISOString()
                })
                .eq('id', payment.due_id);

              remainingAmount -= applyToDue;

              // Log reconciliation
              await supabase!
                .from('payment_reconciliation_logs')
                .insert({
                  tenant_id: tenantId,
                  payment_id: payment.id,
                  member_id: payment.member_id,
                  action: 'BULK_PAYMENT_APPLIED_TO_DUE',
                  details: {
                    due_id: payment.due_id,
                    amount_applied: applyToDue,
                    due_status: newStatus,
                    remaining_after_due: remainingAmount
                  }
                });
            }
          }

          // If there's excess, add to advance balance
          if (remainingAmount > 0) {
            const currentBalance = balanceMap.get(payment.member_id) || 0;
            const newBalance = currentBalance + remainingAmount;

            // Upsert member balance
            const { error: balanceError } = await supabase!
              .from('member_balances')
              .upsert({
                tenant_id: tenantId,
                member_id: payment.member_id,
                advance_balance: newBalance,
                last_reconciled_at: new Date().toISOString()
              }, {
                onConflict: 'tenant_id,member_id'
              });

            if (!balanceError) {
              balanceMap.set(payment.member_id, newBalance);

              // Log advance addition
              await supabase!
                .from('payment_reconciliation_logs')
                .insert({
                  tenant_id: tenantId,
                  payment_id: payment.id,
                  member_id: payment.member_id,
                  action: 'BULK_PAYMENT_EXCESS_TO_ADVANCE',
                  details: {
                    excess_amount: remainingAmount,
                    previous_balance: currentBalance,
                    new_balance: newBalance
                  }
                });
            }
          }
        }
      }
    }

    // Log the bulk action for audit
    await logAdminAction(supabase!, {
      user_id: userId,
      tenant_id: tenantId,
      action_description: `Bulk payments: ${result.created} created (৳${result.total_amount.toLocaleString()}), ${result.skipped} skipped, ${result.failed} failed`,
      entity_type: 'payment',
      entity_id: contribution_type_id,
      before_state: undefined,
      after_state: {
        contribution_type_id,
        payment_date,
        payment_method,
        reference,
        payments_count: result.created,
        total_amount: result.total_amount,
        skipped: result.skipped,
        failed: result.failed
      }
    });

    console.log(`[create-bulk-payments] Complete. Created: ${result.created}, Total: ৳${result.total_amount}, Skipped: ${result.skipped}, Failed: ${result.failed}`);

    return successResponse({
      ...result,
      message: `Successfully recorded ${result.created} payments (৳${result.total_amount.toLocaleString()}). ${result.skipped} skipped. ${result.failed} failed.`
    });

  } catch (error) {
    console.error('[create-bulk-payments] Error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
});
