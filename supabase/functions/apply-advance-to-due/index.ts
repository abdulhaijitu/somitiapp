import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders } from "../_shared/security.ts";

interface ApplyAdvanceRequest {
  due_id: string;
  tenant_id?: string;
}

interface ApplyAdvanceResult {
  success: boolean;
  due_id: string;
  advance_applied: number;
  remaining_advance: number;
  new_due_status: string;
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

    const { due_id }: ApplyAdvanceRequest = await req.json();

    if (!due_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'due_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[apply-advance-to-due] Processing due: ${due_id}`);

    // Get due details
    const { data: due, error: dueError } = await supabase
      .from('dues')
      .select('*')
      .eq('id', due_id)
      .single();

    if (dueError || !due) {
      return new Response(
        JSON.stringify({ success: false, error: 'Due not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if due is already paid
    if (due.status === 'paid') {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Due is already paid',
          due_id,
          advance_applied: 0,
          remaining_advance: 0,
          new_due_status: 'paid'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tenantId = due.tenant_id;
    const memberId = due.member_id;

    // Get member balance
    const { data: memberBalance, error: balanceError } = await supabase
      .from('member_balances')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('member_id', memberId)
      .single();

    if (balanceError || !memberBalance || Number(memberBalance.advance_balance) <= 0) {
      console.log(`[apply-advance-to-due] No advance balance for member ${memberId}`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No advance balance available',
          due_id,
          advance_applied: 0,
          remaining_advance: 0,
          new_due_status: due.status
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const advanceBalance = Number(memberBalance.advance_balance);
    const dueAmount = Number(due.amount);
    const alreadyPaid = Number(due.paid_amount || 0);
    const outstanding = dueAmount - alreadyPaid;

    if (outstanding <= 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Due has no outstanding amount',
          due_id,
          advance_applied: 0,
          remaining_advance: advanceBalance,
          new_due_status: due.status
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate how much advance to apply
    const advanceToApply = Math.min(advanceBalance, outstanding);
    const newPaidAmount = alreadyPaid + advanceToApply;
    const newAdvanceBalance = advanceBalance - advanceToApply;

    // Determine new status
    let newStatus: 'unpaid' | 'partial' | 'paid';
    if (newPaidAmount >= dueAmount) {
      newStatus = 'paid';
    } else if (newPaidAmount > 0) {
      newStatus = 'partial';
    } else {
      newStatus = 'unpaid';
    }

    console.log(`[apply-advance-to-due] Applying ৳${advanceToApply} from advance balance to due ${due_id}`);

    // Update the due
    const { error: updateDueError } = await supabase
      .from('dues')
      .update({
        paid_amount: newPaidAmount,
        status: newStatus,
        advance_from_balance: (Number(due.advance_from_balance) || 0) + advanceToApply,
        updated_at: new Date().toISOString()
      })
      .eq('id', due_id);

    if (updateDueError) {
      console.error('[apply-advance-to-due] Error updating due:', updateDueError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to update due' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update member balance
    const { error: updateBalanceError } = await supabase
      .from('member_balances')
      .update({
        advance_balance: newAdvanceBalance,
        last_reconciled_at: new Date().toISOString()
      })
      .eq('id', memberBalance.id);

    if (updateBalanceError) {
      console.error('[apply-advance-to-due] Error updating balance:', updateBalanceError);
      // Don't return error, due is already updated
    }

    // Log the advance application
    await supabase
      .from('payment_reconciliation_logs')
      .insert({
        tenant_id: tenantId,
        payment_id: due_id, // Using due_id for reference
        member_id: memberId,
        action: 'ADVANCE_APPLIED_TO_DUE',
        details: {
          due_id,
          due_month: due.due_month,
          advance_applied: advanceToApply,
          previous_paid_amount: alreadyPaid,
          new_paid_amount: newPaidAmount,
          previous_advance_balance: advanceBalance,
          new_advance_balance: newAdvanceBalance,
          new_status: newStatus,
          applied_at: new Date().toISOString()
        }
      });

    const result: ApplyAdvanceResult = {
      success: true,
      due_id,
      advance_applied: advanceToApply,
      remaining_advance: newAdvanceBalance,
      new_due_status: newStatus
    };

    console.log(`[apply-advance-to-due] Applied ৳${advanceToApply}, remaining advance: ৳${newAdvanceBalance}, new status: ${newStatus}`);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[apply-advance-to-due] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
