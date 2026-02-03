import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { 
  performSecurityCheck, 
  errorResponse, 
  successResponse, 
  corsHeaders 
} from "../_shared/security.ts";
import { logPaymentEvent } from "../_shared/audit.ts";

const UDDOKTAPAY_API_URL = 'https://pay.uddoktapay.com/api/checkout-v2';

interface ApprovePaymentRequest {
  payment_id: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    const uddoktaPayApiKey = Deno.env.get('UDDOKTAPAY_API_KEY');
    
    if (!uddoktaPayApiKey) {
      console.error('UDDOKTAPAY_API_KEY is not configured');
      return errorResponse('Payment gateway not configured', 500);
    }

    // Perform security check - only admins/managers can approve
    const securityResult = await performSecurityCheck(req, {
      requireAuth: true,
      requireTenant: true,
      allowedRoles: ['admin', 'manager'],
      checkSubscription: true,
      rateLimitType: 'payment'
    });

    if (!securityResult.success) {
      return errorResponse(securityResult.error!, securityResult.status || 403);
    }

    const { context, supabase } = securityResult;
    const userId = context!.userId;
    const tenantId = context!.tenantId!;

    // Parse request
    const body: ApprovePaymentRequest = await req.json();
    const { payment_id } = body;

    if (!payment_id) {
      return errorResponse('payment_id is required', 400);
    }

    // Get the payment
    const { data: payment, error: paymentError } = await supabase!
      .from('payments')
      .select(`
        *,
        member:members(id, name, email, phone)
      `)
      .eq('id', payment_id)
      .eq('tenant_id', tenantId)
      .single();

    if (paymentError || !payment) {
      console.error('Payment not found:', paymentError);
      return errorResponse('Payment not found', 404);
    }

    // Check if this is a member-requested payment awaiting approval
    const metadata = payment.metadata as Record<string, unknown> | null;
    if (!metadata?.member_requested) {
      return errorResponse('This payment was not requested by a member', 400);
    }

    if (metadata?.admin_approved) {
      return errorResponse('This payment has already been approved', 400);
    }

    if (payment.status !== 'pending') {
      return errorResponse(`Cannot approve payment with status: ${payment.status}`, 400);
    }

    const member = payment.member as unknown as { id: string; name: string; email: string | null; phone: string | null } | null;
    if (!member) {
      return errorResponse('Member not found', 404);
    }

    // Generate payment link with UddoktaPay
    const origin = req.headers.get('origin') || 'https://somiti.app';
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    
    // Use member portal URLs for redirect
    const successUrl = `${origin}/member/payments?status=success&ref=${payment.reference}`;
    const cancelUrl = `${origin}/member/payments?status=cancelled&ref=${payment.reference}`;
    const webhookUrl = `${supabaseUrl}/functions/v1/uddoktapay-webhook`;

    const uddoktaPayload = {
      full_name: member.name,
      email: member.email || `${member.id}@somiti.app`,
      amount: String(payment.amount),
      metadata: {
        payment_id: payment.id,
        tenant_id: tenantId,
        member_id: member.id,
        reference: payment.reference
      },
      redirect_url: successUrl,
      cancel_url: cancelUrl,
      webhook_url: webhookUrl
    };

    console.log('Calling UddoktaPay API for approved payment:', payment.id);

    const uddoktaResponse = await fetch(UDDOKTAPAY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'RT-UDDOKTAPAY-API-KEY': uddoktaPayApiKey
      },
      body: JSON.stringify(uddoktaPayload)
    });

    const uddoktaResult = await uddoktaResponse.json();

    if (!uddoktaResponse.ok || !uddoktaResult.payment_url) {
      console.error('UddoktaPay API error:', uddoktaResult);
      
      await logPaymentEvent(supabase!, {
        action: 'PAYMENT_FAILED',
        payment_id: payment.id,
        tenant_id: tenantId,
        user_id: userId,
        amount: Number(payment.amount),
        details: { gateway_error: uddoktaResult.message, approval_failed: true }
      });

      return errorResponse(uddoktaResult.message || 'Failed to create payment link', 500);
    }

    // Update payment with approval and payment link
    const updatedMetadata = {
      ...metadata,
      admin_approved: true,
      approved_at: new Date().toISOString(),
      approved_by: userId
    };

    await supabase!
      .from('payments')
      .update({
        invoice_id: uddoktaResult.invoice_id,
        payment_url: uddoktaResult.payment_url,
        metadata: updatedMetadata
      })
      .eq('id', payment.id);

    // Log the approval
    await logPaymentEvent(supabase!, {
      action: 'PAYMENT_APPROVED',
      payment_id: payment.id,
      tenant_id: tenantId,
      user_id: userId,
      amount: Number(payment.amount),
      details: {
        invoice_id: uddoktaResult.invoice_id,
        member_id: member.id
      }
    });

    // Notify member (create notification)
    await supabase!.from('notifications').insert({
      tenant_id: tenantId,
      member_id: member.id,
      notification_type: 'payment_reminder',
      title: 'Payment Approved',
      title_bn: 'পেমেন্ট অনুমোদিত',
      message: `Your payment request of ৳${payment.amount} has been approved. Click to pay now.`,
      message_bn: `আপনার ৳${payment.amount} পেমেন্ট রিকোয়েস্ট অনুমোদিত হয়েছে। পরিশোধ করতে ক্লিক করুন।`,
      data: {
        type: 'payment_approved',
        payment_id: payment.id,
        payment_url: uddoktaResult.payment_url,
        amount: payment.amount
      }
    });

    console.log('Payment approved successfully:', {
      payment_id: payment.id,
      invoice_id: uddoktaResult.invoice_id
    });

    return successResponse({
      payment_id: payment.id,
      invoice_id: uddoktaResult.invoice_id,
      payment_url: uddoktaResult.payment_url,
      message: 'Payment approved and link generated'
    });

  } catch (error) {
    console.error('Error in approve-payment-request:', error);
    return errorResponse('Internal server error', 500);
  }
});
