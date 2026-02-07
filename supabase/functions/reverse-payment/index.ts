import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders, performSecurityCheck, errorResponse, successResponse } from "../_shared/security.ts";
import { logPaymentEvent } from "../_shared/audit.ts";

/**
 * Reverse a payment's effect on dues and advance balance.
 * Called when a payment is cancelled, failed, or refunded.
 */
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    const securityResult = await performSecurityCheck(req, {
      requireAuth: true,
      requireTenant: true,
      allowedRoles: ['admin', 'manager'],
      checkSubscription: false,
      rateLimitType: 'api'
    });

    if (!securityResult.success) {
      return errorResponse(securityResult.error!, securityResult.status || 403);
    }

    const { context, supabase } = securityResult;
    const tenantId = context!.tenantId!;
    const userId = context!.userId;

    const { payment_id } = await req.json();
    if (!payment_id) {
      return errorResponse('payment_id is required', 400);
    }

    // Get payment details
    const { data: payment, error: paymentError } = await supabase!
      .from('payments')
      .select('*')
      .eq('id', payment_id)
      .eq('tenant_id', tenantId)
      .single();

    if (paymentError || !payment) {
      return errorResponse('Payment not found', 404);
    }

    const memberId = payment.member_id;
    const paymentAmount = Number(payment.amount);
    const advanceApplied = Number(payment.advance_applied || 0);

    console.log(`[reverse-payment] Reversing payment ${payment_id}, amount: ${paymentAmount}, advance: ${advanceApplied}`);

    // 1. If payment was linked to a due, recalculate that due
    if (payment.due_id) {
      // Get all OTHER paid payments linked to this due (exclude this payment)
      const { data: otherPayments } = await supabase!
        .from('payments')
        .select('amount')
        .eq('due_id', payment.due_id)
        .eq('status', 'paid')
        .neq('id', payment_id);

      const totalOtherPaid = (otherPayments || []).reduce(
        (sum: number, p: { amount: number }) => sum + Number(p.amount), 0
      );

      // Get due amount
      const { data: due } = await supabase!
        .from('dues')
        .select('amount')
        .eq('id', payment.due_id)
        .single();

      if (due) {
        const dueAmount = Number(due.amount);
        let newStatus: 'unpaid' | 'partial' | 'paid';
        if (totalOtherPaid >= dueAmount) {
          newStatus = 'paid';
        } else if (totalOtherPaid > 0) {
          newStatus = 'partial';
        } else {
          newStatus = 'unpaid';
        }

        await supabase!
          .from('dues')
          .update({
            paid_amount: totalOtherPaid,
            status: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', payment.due_id);

        console.log(`[reverse-payment] Due ${payment.due_id} updated: paid=${totalOtherPaid}, status=${newStatus}`);
      }
    }

    // 2. Reverse advance balance if any was added
    if (advanceApplied > 0) {
      const { data: balance } = await supabase!
        .from('member_balances')
        .select('id, advance_balance')
        .eq('tenant_id', tenantId)
        .eq('member_id', memberId)
        .single();

      if (balance) {
        const newBalance = Math.max(0, Number(balance.advance_balance) - advanceApplied);
        await supabase!
          .from('member_balances')
          .update({
            advance_balance: newBalance,
            last_reconciled_at: new Date().toISOString()
          })
          .eq('id', balance.id);

        console.log(`[reverse-payment] Advance balance reduced by ${advanceApplied}, new balance: ${newBalance}`);
      }
    }

    // 3. Log reconciliation reversal
    await supabase!
      .from('payment_reconciliation_logs')
      .insert({
        tenant_id: tenantId,
        payment_id: payment_id,
        member_id: memberId,
        action: 'PAYMENT_REVERSED',
        details: {
          payment_amount: paymentAmount,
          advance_reversed: advanceApplied,
          due_id: payment.due_id,
          reversed_by: userId,
          reversed_at: new Date().toISOString()
        }
      });

    // 4. Log payment event
    await logPaymentEvent(supabase!, {
      action: 'PAYMENT_REVERSED',
      payment_id: payment_id,
      tenant_id: tenantId,
      user_id: userId,
      amount: paymentAmount,
      details: {
        advance_reversed: advanceApplied,
        due_id: payment.due_id
      }
    });

    return successResponse({
      success: true,
      payment_id,
      message: 'Payment effects reversed successfully'
    });

  } catch (error) {
    console.error('[reverse-payment] Error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Unknown error', 500);
  }
});
