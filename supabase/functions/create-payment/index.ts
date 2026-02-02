import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const UDDOKTAPAY_API_URL = 'https://pay.uddoktapay.com/api/checkout-v2';

interface PaymentRequest {
  tenant_id: string;
  member_id: string;
  amount: number;
  period_month: number;
  period_year: number;
  full_name: string;
  email?: string;
  metadata?: Record<string, unknown>;
}

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

    // Verify authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create authenticated client to get user
    const supabaseAuth = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const body: PaymentRequest = await req.json();
    const { tenant_id, member_id, amount, period_month, period_year, full_name, email, metadata } = body;

    if (!tenant_id || !member_id || !amount) {
      return new Response(
        JSON.stringify({ error: 'tenant_id, member_id, and amount are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate tenant status and subscription
    const { data: validationResult, error: validationError } = await supabase
      .rpc('validate_tenant_subscription', { _tenant_id: tenant_id });

    if (validationError) {
      console.error('Tenant validation error:', validationError);
      return new Response(
        JSON.stringify({ error: 'Failed to validate tenant' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!validationResult?.valid) {
      return new Response(
        JSON.stringify({ error: validationResult?.error || 'Tenant validation failed' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check user has permission (admin or manager in this tenant)
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('tenant_id', tenant_id)
      .in('role', ['admin', 'manager', 'super_admin'])
      .single();

    if (roleError || !userRole) {
      // Check if super admin
      const { data: isSuperAdmin } = await supabase.rpc('is_super_admin', { _user_id: userId });
      
      if (!isSuperAdmin) {
        return new Response(
          JSON.stringify({ error: 'You do not have permission to create payments' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Verify member belongs to tenant
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id, name, tenant_id')
      .eq('id', member_id)
      .eq('tenant_id', tenant_id)
      .single();

    if (memberError || !member) {
      return new Response(
        JSON.stringify({ error: 'Member not found in this tenant' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate unique reference
    const reference = `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Get redirect URLs from request origin
    const origin = req.headers.get('origin') || 'https://somiti.app';
    const successUrl = `${origin}/dashboard/payments/success?ref=${reference}`;
    const cancelUrl = `${origin}/dashboard/payments/cancelled?ref=${reference}`;
    const webhookUrl = `${supabaseUrl}/functions/v1/uddoktapay-webhook`;

    // Create payment record first (pending status)
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        tenant_id,
        member_id,
        amount,
        payment_type: 'online',
        payment_method: 'other', // Will be updated after payment
        status: 'pending',
        reference,
        period_month,
        period_year,
        metadata: {
          ...metadata,
          initiated_by: userId,
          full_name
        }
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Failed to create payment record:', paymentError);
      return new Response(
        JSON.stringify({ error: 'Failed to create payment record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call UddoktaPay API
    const uddoktaPayload = {
      full_name: full_name || member.name,
      email: email || `${member_id}@somiti.app`,
      amount: amount.toString(),
      metadata: {
        payment_id: payment.id,
        tenant_id,
        member_id,
        reference
      },
      redirect_url: successUrl,
      cancel_url: cancelUrl,
      webhook_url: webhookUrl
    };

    console.log('Calling UddoktaPay API:', { ...uddoktaPayload, amount: amount });

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
      
      // Update payment as failed
      await supabase
        .from('payments')
        .update({ 
          status: 'failed',
          metadata: { 
            ...payment.metadata, 
            error: uddoktaResult.message || 'Payment gateway error' 
          }
        })
        .eq('id', payment.id);

      return new Response(
        JSON.stringify({ error: uddoktaResult.message || 'Failed to create payment' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update payment with invoice_id and payment_url
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        invoice_id: uddoktaResult.invoice_id,
        payment_url: uddoktaResult.payment_url
      })
      .eq('id', payment.id);

    if (updateError) {
      console.error('Failed to update payment with invoice:', updateError);
    }

    // Log the payment initiation
    await supabase.from('payment_logs').insert({
      payment_id: payment.id,
      tenant_id,
      action: 'PAYMENT_INITIATED',
      new_status: 'pending',
      details: {
        amount,
        invoice_id: uddoktaResult.invoice_id,
        initiated_by: userId
      },
      performed_by: userId
    });

    console.log('Payment created successfully:', {
      payment_id: payment.id,
      invoice_id: uddoktaResult.invoice_id
    });

    return new Response(
      JSON.stringify({
        success: true,
        payment_id: payment.id,
        invoice_id: uddoktaResult.invoice_id,
        payment_url: uddoktaResult.payment_url,
        reference
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-payment:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
