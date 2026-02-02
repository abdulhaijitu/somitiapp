import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

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
        JSON.stringify({ error: 'Payment gateway not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const body = await req.json();
    const { invoice_id, reference } = body;

    if (!invoice_id && !reference) {
      return new Response(
        JSON.stringify({ error: 'invoice_id or reference is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find payment record
    let paymentQuery = supabase.from('payments').select('*');
    
    if (invoice_id) {
      paymentQuery = paymentQuery.eq('invoice_id', invoice_id);
    } else {
      paymentQuery = paymentQuery.eq('reference', reference);
    }

    const { data: payment, error: paymentError } = await paymentQuery.single();

    if (paymentError || !payment) {
      console.error('Payment not found:', paymentError);
      return new Response(
        JSON.stringify({ error: 'Payment not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If already verified successfully, return cached result (idempotent)
    if (payment.status === 'paid' && payment.verified_at) {
      console.log('Payment already verified:', payment.id);
      return new Response(
        JSON.stringify({
          success: true,
          status: 'paid',
          payment_id: payment.id,
          already_verified: true
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If no invoice_id, payment wasn't properly initiated
    if (!payment.invoice_id) {
      return new Response(
        JSON.stringify({ error: 'Payment was not properly initiated' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
      return new Response(
        JSON.stringify({ error: 'Failed to verify payment' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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

      const { error: updateError } = await supabase
        .from('payments')
        .update(updateData)
        .eq('id', payment.id);

      if (updateError) {
        console.error('Failed to update payment:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update payment status' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Log the verification
      await supabase.from('payment_logs').insert({
        payment_id: payment.id,
        tenant_id: payment.tenant_id,
        action: 'PAYMENT_VERIFIED',
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

    return new Response(
      JSON.stringify({
        success: true,
        status: newStatus,
        payment_id: payment.id,
        transaction_id: verifyResult.transaction_id,
        payment_method: verifyResult.payment_method,
        amount: verifyResult.amount
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in verify-payment:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
