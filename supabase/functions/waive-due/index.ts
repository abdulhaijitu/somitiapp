import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders, performSecurityCheck, errorResponse, successResponse } from "../_shared/security.ts";
import { logAdminAction } from "../_shared/audit.ts";

interface WaiveDueRequest {
  due_id: string;
  reason: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Security check - require admin role only
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

    const body: WaiveDueRequest = await req.json();
    const { due_id, reason } = body;

    // Validate required fields
    if (!due_id || !reason || reason.trim().length < 5) {
      return errorResponse('Due ID and reason (min 5 characters) are required', 400);
    }

    console.log(`[waive-due] Processing waiver for due ${due_id}`);

    // Get the due
    const { data: due, error: dueError } = await supabase!
      .from('dues')
      .select('*, members(name)')
      .eq('id', due_id)
      .eq('tenant_id', tenantId)
      .single();

    if (dueError || !due) {
      return errorResponse('Due not found or does not belong to this tenant', 404);
    }

    // Only unpaid dues can be waived
    if (due.status === 'paid') {
      return errorResponse('Cannot waive a paid due', 400);
    }

    // Calculate remaining amount to waive
    const remainingAmount = Number(due.amount) - Number(due.paid_amount);

    // Store previous state for audit
    const previousState = {
      status: due.status,
      paid_amount: due.paid_amount,
      amount: due.amount
    };

    // Update the due - mark as paid with waiver note
    const { error: updateError } = await supabase!
      .from('dues')
      .update({
        status: 'paid',
        paid_amount: due.amount, // Mark full amount as paid
        updated_at: new Date().toISOString()
      })
      .eq('id', due_id);

    if (updateError) {
      console.error('[waive-due] Update error:', updateError);
      return errorResponse('Failed to waive due', 500);
    }

    // Log the waiver in payment_reconciliation_logs
    await supabase!
      .from('payment_reconciliation_logs')
      .insert({
        tenant_id: tenantId,
        payment_id: due_id,
        member_id: due.member_id,
        action: 'DUE_WAIVED',
        details: {
          due_id,
          due_month: due.due_month,
          original_amount: due.amount,
          paid_before_waiver: due.paid_amount,
          waived_amount: remainingAmount,
          reason: reason.trim(),
          waived_by: userId,
          waived_at: new Date().toISOString()
        }
      });

    // Log for admin audit
    await logAdminAction(supabase!, {
      user_id: userId,
      tenant_id: tenantId,
      action_description: `Waived due of ৳${remainingAmount} for member ${due.members?.name || due.member_id}`,
      entity_type: 'payment',
      entity_id: due_id,
      before_state: previousState,
      after_state: {
        status: 'paid',
        paid_amount: due.amount,
        waived_amount: remainingAmount,
        waiver_reason: reason.trim()
      }
    });

    console.log(`[waive-due] Successfully waived ৳${remainingAmount} for due ${due_id}`);

    return successResponse({
      due_id,
      waived_amount: remainingAmount,
      message: `Successfully waived ৳${remainingAmount}`
    });

  } catch (error) {
    console.error('[waive-due] Error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
});
