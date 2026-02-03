import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders } from "../_shared/security.ts";
import { logPaymentEvent } from "../_shared/audit.ts";

interface ReconcileRequest {
  payment_id: string;
  tenant_id?: string; // Optional, will be resolved from payment
}

interface ReconcileResult {
  success: boolean;
  payment_id: string;
  dues_settled: { due_id: string; amount_applied: number; new_status: string }[];
  advance_balance: number;
  total_applied: number;
  error?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { payment_id }: ReconcileRequest = await req.json();

    if (!payment_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'payment_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[reconcile-payment] Starting reconciliation for payment: ${payment_id}`);

    // Get payment details
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', payment_id)
      .single();

    if (paymentError || !payment) {
      return new Response(
        JSON.stringify({ success: false, error: 'Payment not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Only process paid payments
    if (payment.status !== 'paid') {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Payment is not in paid status, skipping reconciliation',
          payment_status: payment.status
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tenantId = payment.tenant_id;
    const memberId = payment.member_id;
    let remainingAmount = Number(payment.amount);
    const duesSettled: { due_id: string; amount_applied: number; new_status: string }[] = [];

    // Validate tenant subscription
    const { data: subscriptionValid } = await supabase
      .rpc('validate_tenant_subscription', { _tenant_id: tenantId });

    if (!subscriptionValid?.valid) {
      return new Response(
        JSON.stringify({ success: false, error: subscriptionValid?.error || 'Subscription invalid' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all unpaid/partial dues for this member, ordered by oldest first
    const { data: unpaidDues, error: duesError } = await supabase
      .from('dues')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('member_id', memberId)
      .in('status', ['unpaid', 'partial'])
      .order('due_month', { ascending: true });

    if (duesError) {
      console.error('[reconcile-payment] Error fetching dues:', duesError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch dues' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[reconcile-payment] Found ${unpaidDues?.length || 0} unpaid/partial dues for member ${memberId}`);

    // Apply payment to dues chronologically
    for (const due of (unpaidDues || [])) {
      if (remainingAmount <= 0) break;

      const dueAmount = Number(due.amount);
      const alreadyPaid = Number(due.paid_amount || 0);
      const outstanding = dueAmount - alreadyPaid;

      if (outstanding <= 0) continue;

      const amountToApply = Math.min(remainingAmount, outstanding);
      const newPaidAmount = alreadyPaid + amountToApply;
      
      let newStatus: 'unpaid' | 'partial' | 'paid';
      if (newPaidAmount >= dueAmount) {
        newStatus = 'paid';
      } else if (newPaidAmount > 0) {
        newStatus = 'partial';
      } else {
        newStatus = 'unpaid';
      }

      // Update the due
      const { error: updateError } = await supabase
        .from('dues')
        .update({
          paid_amount: newPaidAmount,
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', due.id);

      if (updateError) {
        console.error(`[reconcile-payment] Error updating due ${due.id}:`, updateError);
        continue;
      }

      duesSettled.push({
        due_id: due.id,
        amount_applied: amountToApply,
        new_status: newStatus
      });

      remainingAmount -= amountToApply;
      console.log(`[reconcile-payment] Applied ৳${amountToApply} to due ${due.id}, remaining: ৳${remainingAmount}`);
    }

    // Handle advance balance
    let advanceBalance = 0;
    if (remainingAmount > 0) {
      console.log(`[reconcile-payment] ৳${remainingAmount} remaining after settling dues, adding to advance balance`);
      
      // Get or create member balance record
      const { data: existingBalance } = await supabase
        .from('member_balances')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('member_id', memberId)
        .single();

      if (existingBalance) {
        advanceBalance = Number(existingBalance.advance_balance) + remainingAmount;
        
        await supabase
          .from('member_balances')
          .update({
            advance_balance: advanceBalance,
            last_reconciled_at: new Date().toISOString()
          })
          .eq('id', existingBalance.id);
      } else {
        advanceBalance = remainingAmount;
        
        await supabase
          .from('member_balances')
          .insert({
            tenant_id: tenantId,
            member_id: memberId,
            advance_balance: advanceBalance,
            last_reconciled_at: new Date().toISOString()
          });
      }

      // Update payment record with advance applied
      await supabase
        .from('payments')
        .update({ advance_applied: remainingAmount })
        .eq('id', payment_id);
    }

    // Log reconciliation for audit
    await supabase
      .from('payment_reconciliation_logs')
      .insert({
        tenant_id: tenantId,
        payment_id: payment_id,
        member_id: memberId,
        action: 'PAYMENT_RECONCILED',
        details: {
          payment_amount: payment.amount,
          dues_settled: duesSettled,
          advance_added: remainingAmount > 0 ? remainingAmount : 0,
          total_advance_balance: advanceBalance,
          reconciled_at: new Date().toISOString()
        }
      });

    // Log payment event
    await logPaymentEvent(supabase, {
      action: 'PAYMENT_VERIFIED',
      payment_id: payment_id,
      tenant_id: tenantId,
      amount: Number(payment.amount),
      details: {
        dues_settled_count: duesSettled.length,
        advance_balance: advanceBalance
      }
    });

    const result: ReconcileResult = {
      success: true,
      payment_id,
      dues_settled: duesSettled,
      advance_balance: advanceBalance,
      total_applied: Number(payment.amount) - remainingAmount
    };

    console.log(`[reconcile-payment] Completed. Settled ${duesSettled.length} dues, advance balance: ৳${advanceBalance}`);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[reconcile-payment] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
