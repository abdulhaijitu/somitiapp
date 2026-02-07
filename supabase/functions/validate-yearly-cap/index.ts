import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders, performSecurityCheck, errorResponse, successResponse } from "../_shared/security.ts";

interface ValidateCapRequest {
  member_id: string;
  amount: number;
  validation_type: 'payment' | 'due_generation';
  year?: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const securityCheck = await performSecurityCheck(req, {
      requireAuth: true,
      requireTenant: true,
      allowedRoles: ['admin', 'manager'],
      checkSubscription: true,
      rateLimitType: 'api'
    });

    if (!securityCheck.success) {
      return errorResponse(securityCheck.error || 'Unauthorized', securityCheck.status || 403);
    }

    const { context, supabase } = securityCheck;
    const tenantId = context!.tenantId!;

    const body: ValidateCapRequest = await req.json();
    const { member_id, amount, validation_type, year } = body;

    if (!member_id || amount === undefined || !validation_type) {
      return errorResponse('Missing required fields: member_id, amount, validation_type', 400);
    }

    const targetYear = year || new Date().getFullYear();

    const { data: summary, error: summaryError } = await supabase!
      .rpc('get_member_yearly_summary', {
        _member_id: member_id,
        _tenant_id: tenantId,
        _year: targetYear
      });

    if (summaryError || !summary) {
      console.error('[validate-yearly-cap] Error:', summaryError);
      return errorResponse('Failed to calculate yearly summary', 500);
    }

    if (summary.error) {
      return errorResponse(summary.error, 404);
    }

    const yearlyCap = Number(summary.yearly_cap);
    const totalPaid = Number(summary.total_paid);
    const remainingAllowance = Number(summary.remaining_allowance);

    let allowed = true;
    let message = '';
    let message_bn = '';

    if (validation_type === 'payment') {
      if (amount > remainingAllowance) {
        allowed = false;
        message = `Yearly contribution limit exceeded. Cap: ৳${yearlyCap.toLocaleString()}, Already paid: ৳${totalPaid.toLocaleString()}, Remaining: ৳${remainingAllowance.toLocaleString()}, Attempted: ৳${amount.toLocaleString()}`;
        message_bn = `বার্ষিক চাঁদা সীমা অতিক্রম করেছে। সীমা: ৳${yearlyCap.toLocaleString()}, ইতোমধ্যে পরিশোধ: ৳${totalPaid.toLocaleString()}, অবশিষ্ট: ৳${remainingAllowance.toLocaleString()}, চেষ্টা: ৳${amount.toLocaleString()}`;

        // Log rejection
        await supabase!.from('audit_logs').insert({
          action: 'YEARLY_CAP_PAYMENT_REJECTED',
          entity_type: 'payment',
          entity_id: member_id,
          user_id: context!.userId,
          details: {
            tenant_id: tenantId,
            member_id,
            year: targetYear,
            attempted_amount: amount,
            yearly_cap: yearlyCap,
            total_paid: totalPaid,
            remaining_allowance: remainingAllowance
          }
        });
      }
    } else if (validation_type === 'due_generation') {
      const totalDuesGenerated = Number(summary.total_dues_generated);
      if (totalDuesGenerated + amount > yearlyCap) {
        allowed = false;
        message = `Due generation would exceed yearly cap. Cap: ৳${yearlyCap.toLocaleString()}, Dues generated: ৳${totalDuesGenerated.toLocaleString()}, New due: ৳${amount.toLocaleString()}`;
        message_bn = `বকেয়া তৈরি করলে বার্ষিক সীমা অতিক্রম হবে। সীমা: ৳${yearlyCap.toLocaleString()}, তৈরি হয়েছে: ৳${totalDuesGenerated.toLocaleString()}, নতুন: ৳${amount.toLocaleString()}`;

        await supabase!.from('audit_logs').insert({
          action: 'YEARLY_CAP_DUE_SKIPPED',
          entity_type: 'payment',
          entity_id: member_id,
          user_id: context!.userId,
          details: {
            tenant_id: tenantId,
            member_id,
            year: targetYear,
            attempted_due_amount: amount,
            yearly_cap: yearlyCap,
            total_dues_generated: totalDuesGenerated
          }
        });
      }

      // Also check monthly dues count for monthly type
      if (allowed && summary.monthly_dues_count >= 12) {
        const monthlyBase = Number(summary.monthly_base);
        if (amount === monthlyBase) {
          allowed = false;
          message = `Maximum 12 monthly dues already generated for ${targetYear}`;
          message_bn = `${targetYear} সালে ইতোমধ্যে ১২টি মাসিক বকেয়া তৈরি হয়েছে`;
        }
      }
    }

    return successResponse({
      allowed,
      message: allowed ? '' : message,
      message_bn: allowed ? '' : message_bn,
      summary: {
        yearly_cap: yearlyCap,
        total_paid: totalPaid,
        remaining_allowance: remainingAllowance,
        total_dues_generated: Number(summary.total_dues_generated),
        cap_usage_percent: Number(summary.cap_usage_percent),
        is_at_limit: summary.is_at_limit,
        is_near_limit: summary.is_near_limit
      }
    });

  } catch (error) {
    console.error('[validate-yearly-cap] Error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
});
