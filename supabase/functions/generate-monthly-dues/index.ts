import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders } from "../_shared/security.ts";

interface DueGenerationResult {
  tenant_id: string;
  tenant_name: string;
  dues_created: number;
  dues_skipped: number;
  errors: string[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current date info
    const now = new Date();
    const currentDay = now.getDate();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const dueMonthStr = currentMonth.toISOString().split('T')[0];

    console.log(`[generate-monthly-dues] Running for day ${currentDay}, month ${dueMonthStr}`);

    // Get all enabled monthly due settings where generation day matches today
    const { data: settings, error: settingsError } = await supabase
      .from('monthly_due_settings')
      .select(`
        *,
        tenants!inner(id, name, status),
        contribution_types!inner(id, name, is_active)
      `)
      .eq('is_enabled', true)
      .eq('generation_day', currentDay);

    if (settingsError) {
      console.error('Error fetching settings:', settingsError);
      throw settingsError;
    }

    if (!settings || settings.length === 0) {
      console.log('[generate-monthly-dues] No settings match today\'s generation day');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No tenants scheduled for due generation today',
          processed: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results: DueGenerationResult[] = [];

    for (const setting of settings) {
      const result: DueGenerationResult = {
        tenant_id: setting.tenant_id,
        tenant_name: setting.tenants?.name || 'Unknown',
        dues_created: 0,
        dues_skipped: 0,
        errors: []
      };

      try {
        // Check tenant status
        if (setting.tenants?.status !== 'active') {
          result.errors.push('Tenant is not active');
          results.push(result);
          continue;
        }

        // Check contribution type is active
        if (!setting.contribution_types?.is_active) {
          result.errors.push('Contribution type is not active');
          results.push(result);
          continue;
        }

        // Check start month
        const startMonth = new Date(setting.start_month);
        if (currentMonth < startMonth) {
          result.errors.push('Current month is before start month');
          results.push(result);
          continue;
        }

        // Validate tenant subscription
        const { data: subscriptionValid, error: subError } = await supabase
          .rpc('validate_tenant_subscription', { _tenant_id: setting.tenant_id });

        if (subError || !subscriptionValid?.valid) {
          result.errors.push(subscriptionValid?.error || 'Subscription validation failed');
          results.push(result);
          continue;
        }

        // Get active members for this tenant
        let membersQuery = supabase
          .from('members')
          .select('id, name, joined_at')
          .eq('tenant_id', setting.tenant_id)
          .eq('status', 'active');

        // Optionally exclude members who joined after the generation date
        if (!setting.include_members_joined_after_generation) {
          const generationDate = new Date(now.getFullYear(), now.getMonth(), setting.generation_day);
          membersQuery = membersQuery.lte('joined_at', generationDate.toISOString());
        }

        const { data: members, error: membersError } = await membersQuery;

        if (membersError) {
          result.errors.push(`Failed to fetch members: ${membersError.message}`);
          results.push(result);
          continue;
        }

        if (!members || members.length === 0) {
          result.errors.push('No active members found');
          results.push(result);
          continue;
        }

        console.log(`[generate-monthly-dues] Processing ${members.length} members for tenant ${setting.tenant_id}`);

        // Check existing dues for this month to avoid duplicates
        const { data: existingDues, error: existingError } = await supabase
          .from('dues')
          .select('member_id')
          .eq('tenant_id', setting.tenant_id)
          .eq('contribution_type_id', setting.contribution_type_id)
          .eq('due_month', dueMonthStr);

        if (existingError) {
          result.errors.push(`Failed to check existing dues: ${existingError.message}`);
          results.push(result);
          continue;
        }

        const existingMemberIds = new Set((existingDues || []).map(d => d.member_id));

        // Get member balances for advance application
        const { data: memberBalances } = await supabase
          .from('member_balances')
          .select('member_id, advance_balance')
          .eq('tenant_id', setting.tenant_id)
          .gt('advance_balance', 0);

        const balanceMap = new Map(
          (memberBalances || []).map(b => [b.member_id, Number(b.advance_balance)])
        );

        // Prepare dues to insert
        const membersToProcess = members.filter(member => !existingMemberIds.has(member.id));
        
        result.dues_skipped = existingMemberIds.size;

        if (membersToProcess.length > 0) {
          // Insert in batches of 100
          const batchSize = 100;
          for (let i = 0; i < membersToProcess.length; i += batchSize) {
            const batch = membersToProcess.slice(i, i + batchSize);
            
            // Prepare dues with advance consideration
            const duesToInsert = batch.map(member => {
              const advanceBalance = balanceMap.get(member.id) || 0;
              const dueAmount = Number(setting.fixed_amount);
              const advanceToApply = Math.min(advanceBalance, dueAmount);
              
              let status: 'unpaid' | 'partial' | 'paid' = 'unpaid';
              if (advanceToApply >= dueAmount) {
                status = 'paid';
              } else if (advanceToApply > 0) {
                status = 'partial';
              }

              return {
                tenant_id: setting.tenant_id,
                member_id: member.id,
                contribution_type_id: setting.contribution_type_id,
                amount: setting.fixed_amount,
                paid_amount: advanceToApply,
                advance_from_balance: advanceToApply,
                due_month: dueMonthStr,
                status,
                generated_at: now.toISOString()
              };
            });

            const { error: insertError, data: insertedDues } = await supabase
              .from('dues')
              .insert(duesToInsert)
              .select('id, member_id, advance_from_balance');

            if (insertError) {
              result.errors.push(`Batch insert failed: ${insertError.message}`);
            } else {
              result.dues_created += batch.length;

              // Update member balances for those who had advance applied
              if (insertedDues) {
                for (const due of insertedDues) {
                  const advanceApplied = Number(due.advance_from_balance) || 0;
                  if (advanceApplied > 0) {
                    const currentBalance = balanceMap.get(due.member_id) || 0;
                    const newBalance = currentBalance - advanceApplied;
                    
                    await supabase
                      .from('member_balances')
                      .update({ 
                        advance_balance: newBalance,
                        last_reconciled_at: now.toISOString()
                      })
                      .eq('tenant_id', setting.tenant_id)
                      .eq('member_id', due.member_id);

                    // Log the advance application
                    await supabase
                      .from('payment_reconciliation_logs')
                      .insert({
                        tenant_id: setting.tenant_id,
                        payment_id: due.id, // Using due_id
                        member_id: due.member_id,
                        action: 'ADVANCE_AUTO_APPLIED',
                        details: {
                          due_id: due.id,
                          due_month: dueMonthStr,
                          advance_applied: advanceApplied,
                          previous_balance: currentBalance,
                          new_balance: newBalance,
                          applied_at: now.toISOString()
                        }
                      });
                  }
                }
              }
            }
          }
        }

        console.log(`[generate-monthly-dues] Tenant ${setting.tenant_id}: Created ${result.dues_created}, Skipped ${result.dues_skipped}`);

      } catch (err) {
        result.errors.push(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
      }

      results.push(result);
    }

    const totalCreated = results.reduce((sum, r) => sum + r.dues_created, 0);
    const totalSkipped = results.reduce((sum, r) => sum + r.dues_skipped, 0);
    const tenantsWithErrors = results.filter(r => r.errors.length > 0).length;

    console.log(`[generate-monthly-dues] Complete. Created: ${totalCreated}, Skipped: ${totalSkipped}, Errors: ${tenantsWithErrors}`);

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          tenants_processed: results.length,
          total_dues_created: totalCreated,
          total_dues_skipped: totalSkipped,
          tenants_with_errors: tenantsWithErrors
        },
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[generate-monthly-dues] Fatal error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
