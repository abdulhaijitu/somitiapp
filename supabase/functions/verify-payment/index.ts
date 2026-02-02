import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { 
  performSecurityCheck, 
  errorResponse, 
  successResponse, 
  corsHeaders 
} from "../_shared/security.ts";
import { logPaymentEvent, logSecurityViolation } from "../_shared/audit.ts";

const UDDOKTAPAY_VERIFY_URL = 'https://pay.uddoktapay.com/api/verify-payment';

// Map UddoktaPay payment methods to our enum
const PAYMENT_METHOD_MAP: Record<string, string> = {
  'bkash': 'bkash',
  'nagad': 'nagad',
  'rocket': 'rocket',
  'upay': 'other',
  'card': 'card',
  'tap': 'other',
  'okwallet': 'other',
  'default': 'other'
};

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

    // Security check - require auth but allow viewing any payment user has access to
    const securityResult = await performSecurityCheck(req, {
      requireAuth: true,
      requireTenant: false, // We'll verify against the payment's tenant
      checkSubscription: false, // Allow verification even with expired subscription
      rateLimitType: 'api'
    });

    if (!securityResult.success) {
      if (securityResult.status === 429) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        await logSecurityViolation(supabase, {
          action: 'RATE_LIMIT_EXCEEDED',
          user_id: securityResult.context?.userId,
          ip_address: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
          resource: 'verify-payment'
        });
      }
      return errorResponse(securityResult.error!, securityResult.status || 403);
    }

    const { context, supabase } = securityResult;
    const userId = context!.userId;
    const userTenantId = context!.tenantId;
    const isSuperAdmin = context!.isSuperAdmin;

    // Parse request body
    const body = await req.json();
    const { invoice_id, reference } = body;

    if (!invoice_id && !reference) {
      return errorResponse('invoice_id or reference is required', 400);
    }

    // Find payment record
    let paymentQuery = supabase!.from('payments').select('*');
    
    if (invoice_id) {
      paymentQuery = paymentQuery.eq('invoice_id', invoice_id);
    } else {
      paymentQuery = paymentQuery.eq('reference', reference);
    }

    const { data: payment, error: paymentError } = await paymentQuery.single();

    if (paymentError || !payment) {
      console.error('Payment not found:', paymentError);
      return errorResponse('Payment not found', 404);
    }

    // Verify user has access to this payment's tenant
    if (!isSuperAdmin && payment.tenant_id !== userTenantId) {
      await logSecurityViolation(supabase!, {
        action: 'PERMISSION_DENIED',
        user_id: userId,
        tenant_id: userTenantId,
        ip_address: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
        resource: 'verify-payment',
        attempted_action: `access_payment_${payment.id}`
      });
      return errorResponse('Access denied', 403);
    }

    // If already verified successfully, return cached result (idempotent)
    if (payment.status === 'paid' && payment.verified_at) {
      console.log('Payment already verified:', payment.id);
      return successResponse({
        status: 'paid',
        payment_id: payment.id,
        already_verified: true
      });
    }

    // If no invoice_id, payment wasn't properly initiated
    if (!payment.invoice_id) {
      return errorResponse('Payment was not properly initiated', 400);
    }

    // Call UddoktaPay verify API
    console.log('Verifying payment with UddoktaPay:', payment.invoice_id);

    const verifyResponse = await fetch(UDDOKTAPAY_VERIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'RT-UDDOKTAPAY-API-KEY': uddoktaPayApiKey
      },
      body: JSON.stringify({ invoice_id: payment.invoice_id })
    });

    const verifyResult = await verifyResponse.json();

    if (!verifyResponse.ok) {
      console.error('UddoktaPay verify error:', verifyResult);
      return errorResponse('Failed to verify payment', 500);
    }

    console.log('UddoktaPay verify result:', verifyResult);

    // Determine new status based on UddoktaPay response
    let newStatus: string;
    const uddoktaStatus = verifyResult.status?.toLowerCase();

    switch (uddoktaStatus) {
      case 'completed':
        newStatus = 'paid';
        break;
      case 'pending':
        newStatus = 'pending';
        break;
      case 'cancelled':
        newStatus = 'cancelled';
        break;
      default:
        newStatus = 'failed';
    }

    const previousStatus = payment.status;

    // Only update if status changed
    if (newStatus !== previousStatus) {
      const paymentMethod = PAYMENT_METHOD_MAP[verifyResult.payment_method?.toLowerCase()] || 'other';

      const updateData: Record<string, unknown> = {
        status: newStatus,
        verified_at: new Date().toISOString(),
        metadata: {
          ...payment.metadata,
          uddoktapay_response: verifyResult
        }
      };

      if (newStatus === 'paid') {
        updateData.payment_date = new Date().toISOString();
        updateData.payment_method = paymentMethod;
        updateData.transaction_id = verifyResult.transaction_id;
        updateData.sender_number = verifyResult.sender_number;
        updateData.charged_amount = parseFloat(verifyResult.amount) || payment.amount;
        updateData.fee = parseFloat(verifyResult.fee) || 0;
      }

      const { error: updateError } = await supabase!
        .from('payments')
        .update(updateData)
        .eq('id', payment.id);

      if (updateError) {
        console.error('Failed to update payment:', updateError);
        return errorResponse('Failed to update payment status', 500);
      }

      // Log the verification
      await logPaymentEvent(supabase!, {
        action: 'PAYMENT_VERIFIED',
        payment_id: payment.id,
        tenant_id: payment.tenant_id,
        user_id: userId,
        previous_status: previousStatus,
        new_status: newStatus,
        details: {
          uddoktapay_status: uddoktaStatus,
          transaction_id: verifyResult.transaction_id,
          payment_method: verifyResult.payment_method
        }
      });

      console.log('Payment updated:', { 
        payment_id: payment.id, 
        previousStatus, 
        newStatus 
      });
    }

    return successResponse({
      status: newStatus,
      payment_id: payment.id,
      transaction_id: verifyResult.transaction_id,
      payment_method: verifyResult.payment_method,
      amount: verifyResult.amount
    });

  } catch (error) {
    console.error('Error in verify-payment:', error);
    return errorResponse('Internal server error', 500);
  }
});
