import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders, errorResponse, successResponse } from "../_shared/security.ts";
import { logPaymentEvent } from "../_shared/audit.ts";

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const uddoktaPayApiKey = Deno.env.get('UDDOKTAPAY_API_KEY');
    
    if (!uddoktaPayApiKey) {
      console.error('UDDOKTAPAY_API_KEY is not configured');
      return errorResponse('Configuration error', 500);
    }

    // Verify the webhook is from UddoktaPay using API key header
    const webhookApiKey = req.headers.get('RT-UDDOKTAPAY-API-KEY');
    
    if (webhookApiKey !== uddoktaPayApiKey) {
      console.error('Invalid webhook API key');
      return errorResponse('Unauthorized', 401);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse webhook payload
    const payload = await req.json();
    
    console.log('Received webhook payload:', JSON.stringify(payload, null, 2));

    const {
      invoice_id,
      status,
      amount,
      fee,
      transaction_id,
      sender_number,
      payment_method
    } = payload;

    if (!invoice_id) {
      console.error('No invoice_id in webhook payload');
      return errorResponse('Invalid payload', 400);
    }

    // Find payment by invoice_id
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('invoice_id', invoice_id)
      .single();

    if (paymentError || !payment) {
      console.error('Payment not found for invoice:', invoice_id, paymentError);
      // Return 200 to acknowledge receipt even if we can't find the payment
      return successResponse({ received: true, warning: 'Payment not found' });
    }

    // Idempotency check - if already in final state, skip update
    if (['paid', 'refunded'].includes(payment.status) && payment.verified_at) {
      console.log('Payment already in final state, skipping update:', payment.id);
      return successResponse({ received: true, status: 'already_processed' });
    }

    // Determine new status
    let newStatus: string;
    const webhookStatus = status?.toLowerCase();

    switch (webhookStatus) {
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
    const mappedPaymentMethod = PAYMENT_METHOD_MAP[payment_method?.toLowerCase()] || 'other';

    // Build update object
    const updateData: Record<string, unknown> = {
      status: newStatus,
      verified_at: new Date().toISOString(),
      metadata: {
        ...payment.metadata,
        webhook_payload: payload
      }
    };

    if (newStatus === 'paid') {
      updateData.payment_date = new Date().toISOString();
      updateData.payment_method = mappedPaymentMethod;
      updateData.transaction_id = transaction_id;
      updateData.sender_number = sender_number;
      updateData.charged_amount = parseFloat(amount) || payment.amount;
      updateData.fee = parseFloat(fee) || 0;
    }

    // Update payment (transactional)
    const { error: updateError } = await supabase
      .from('payments')
      .update(updateData)
      .eq('id', payment.id);

    if (updateError) {
      console.error('Failed to update payment:', updateError);
      return errorResponse('Failed to update payment', 500);
    }

    // Log the webhook update
    await logPaymentEvent(supabase, {
      action: 'WEBHOOK_RECEIVED',
      payment_id: payment.id,
      tenant_id: payment.tenant_id,
      previous_status: previousStatus,
      new_status: newStatus,
      details: {
        webhook_status: webhookStatus,
        transaction_id,
        payment_method,
        sender_number,
        amount,
        fee
      }
    });

    console.log('Webhook processed successfully:', {
      payment_id: payment.id,
      previousStatus,
      newStatus,
      transaction_id
    });

    return successResponse({ 
      received: true, 
      payment_id: payment.id,
      status: newStatus 
    });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return errorResponse('Internal server error', 500);
  }
});
