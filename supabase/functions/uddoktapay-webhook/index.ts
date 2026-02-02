import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, rt-uddoktapay-api-key, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

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
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const uddoktaPayApiKey = Deno.env.get('UDDOKTAPAY_API_KEY');
    
    if (!uddoktaPayApiKey) {
      console.error('UDDOKTAPAY_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'Configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the webhook is from UddoktaPay
    const webhookApiKey = req.headers.get('RT-UDDOKTAPAY-API-KEY');
    
    if (webhookApiKey !== uddoktaPayApiKey) {
      console.error('Invalid webhook API key');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
      payment_method,
      metadata
    } = payload;

    if (!invoice_id) {
      console.error('No invoice_id in webhook payload');
      return new Response(
        JSON.stringify({ error: 'Invalid payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
      return new Response(
        JSON.stringify({ received: true, warning: 'Payment not found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Idempotency check - if already in final state, skip update
    if (['paid', 'refunded'].includes(payment.status) && payment.verified_at) {
      console.log('Payment already in final state, skipping update:', payment.id);
      return new Response(
        JSON.stringify({ received: true, status: 'already_processed' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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

    // Update payment
    const { error: updateError } = await supabase
      .from('payments')
      .update(updateData)
      .eq('id', payment.id);

    if (updateError) {
      console.error('Failed to update payment:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update payment' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log the webhook update
    await supabase.from('payment_logs').insert({
      payment_id: payment.id,
      tenant_id: payment.tenant_id,
      action: 'WEBHOOK_RECEIVED',
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

    return new Response(
      JSON.stringify({ 
        received: true, 
        payment_id: payment.id,
        status: newStatus 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
