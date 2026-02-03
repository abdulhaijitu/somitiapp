import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders } from "../_shared/security.ts";

/**
 * Migration script to calculate and populate advance balances for existing members
 * This should be run once to migrate existing overpayments to the new advance balance system
 */

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Optional: specify a tenant_id in the request body to migrate only one tenant
    let tenantId: string | null = null;
    try {
      const body = await req.json();
      tenantId = body.tenant_id || null;
    } catch {
      // No body provided, process all tenants
    }

    console.log('[migrate-advance-balances] Starting migration...');

    // Get all active tenants (or specific tenant)
    let tenantsQuery = supabase
      .from('tenants')
      .select('id, name')
      .eq('status', 'active');

    if (tenantId) {
      tenantsQuery = tenantsQuery.eq('id', tenantId);
    }

    const { data: tenants, error: tenantsError } = await tenantsQuery;

    if (tenantsError || !tenants) {
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch tenants' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = [];

    for (const tenant of tenants) {
      console.log(`[migrate-advance-balances] Processing tenant: ${tenant.name} (${tenant.id})`);

      // Get all members for this tenant
      const { data: members, error: membersError } = await supabase
        .from('members')
        .select('id')
        .eq('tenant_id', tenant.id);

      if (membersError || !members) {
        results.push({ tenant_id: tenant.id, tenant_name: tenant.name, error: 'Failed to fetch members' });
        continue;
      }

      let membersProcessed = 0;
      let advanceBalancesCreated = 0;

      for (const member of members) {
        // Get all dues for this member
        const { data: dues } = await supabase
          .from('dues')
          .select('id, amount, paid_amount, status')
          .eq('member_id', member.id)
          .eq('tenant_id', tenant.id);

        // Get all paid payments for this member
        const { data: payments } = await supabase
          .from('payments')
          .select('id, amount')
          .eq('member_id', member.id)
          .eq('tenant_id', tenant.id)
          .eq('status', 'paid');

        if (!dues || !payments) continue;

        // Calculate total dues amount
        const totalDuesAmount = dues.reduce((sum, d) => sum + Number(d.amount), 0);
        
        // Calculate total paid amount
        const totalPaidAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0);

        // Calculate advance balance (if paid more than dues)
        const advanceBalance = Math.max(0, totalPaidAmount - totalDuesAmount);

        if (advanceBalance > 0) {
          // Check if balance record exists
          const { data: existingBalance } = await supabase
            .from('member_balances')
            .select('id, advance_balance')
            .eq('tenant_id', tenant.id)
            .eq('member_id', member.id)
            .single();

          if (existingBalance) {
            // Update existing record if new balance is higher
            if (advanceBalance > Number(existingBalance.advance_balance)) {
              await supabase
                .from('member_balances')
                .update({ 
                  advance_balance: advanceBalance,
                  last_reconciled_at: new Date().toISOString()
                })
                .eq('id', existingBalance.id);
              advanceBalancesCreated++;
            }
          } else {
            // Create new balance record
            await supabase
              .from('member_balances')
              .insert({
                tenant_id: tenant.id,
                member_id: member.id,
                advance_balance: advanceBalance,
                last_reconciled_at: new Date().toISOString()
              });
            advanceBalancesCreated++;
          }
        }

        membersProcessed++;
      }

      results.push({
        tenant_id: tenant.id,
        tenant_name: tenant.name,
        members_processed: membersProcessed,
        advance_balances_created: advanceBalancesCreated
      });
    }

    console.log('[migrate-advance-balances] Migration complete');

    return new Response(
      JSON.stringify({
        success: true,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[migrate-advance-balances] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
