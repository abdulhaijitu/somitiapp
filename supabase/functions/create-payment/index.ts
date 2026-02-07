import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { 
  performSecurityCheck, 
  errorResponse, 
  successResponse, 
  corsHeaders,
  logSecurityEvent 
} from "../_shared/security.ts";
import { logPaymentEvent, logSecurityViolation } from "../_shared/audit.ts";

const UDDOKTAPAY_API_URL = 'https://pay.uddoktapay.com/api/checkout-v2';

interface PaymentRequest {
  member_id: string;
  amount: number;
  period_month: number;
  period_year: number;
  full_name: string;
  email?: string;
  contribution_type_id?: string;
  metadata?: Record<string, unknown>;
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

    // Perform comprehensive security check
    // - Validates auth token
    // - Resolves tenant from user roles (SERVER-SIDE - never trust client)
    // - Checks subscription validity
    // - Applies rate limiting
    const securityResult = await performSecurityCheck(req, {
      requireAuth: true,
      requireTenant: true,
      allowedRoles: ['admin', 'manager'],
      checkSubscription: true,
      rateLimitType: 'payment'
    });

    if (!securityResult.success) {
      // Log security violation for non-auth failures
      if (securityResult.status === 403 || securityResult.status === 429) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        await logSecurityViolation(supabase, {
          action: securityResult.status === 429 ? 'RATE_LIMIT_EXCEEDED' : 'PERMISSION_DENIED',
          user_id: securityResult.context?.userId,
          tenant_id: securityResult.context?.tenantId,
          ip_address: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
          resource: 'create-payment',
          attempted_action: 'initiate_payment'
        });
      }
      
      return errorResponse(securityResult.error!, securityResult.status || 403);
    }

    const { context, supabase } = securityResult;
    const userId = context!.userId;
    const tenantId = context!.tenantId!; // Guaranteed by security check

    // Parse request body
    // IMPORTANT: tenant_id is NOT accepted from client - it's resolved server-side
    const body: PaymentRequest = await req.json();
    const { member_id, amount, period_month, period_year, full_name, email, contribution_type_id, metadata } = body;

    if (!member_id || !amount) {
      return errorResponse('member_id and amount are required', 400);
    }

    // Validate contribution_type_id if provided
    if (contribution_type_id) {
      const { data: contribType, error: contribError } = await supabase!
        .from('contribution_types')
        .select('id, is_active')
        .eq('id', contribution_type_id)
        .eq('tenant_id', tenantId)
        .single();

      if (contribError || !contribType) {
        return errorResponse('Invalid contribution type', 400);
      }

      if (!contribType.is_active) {
        return errorResponse('This contribution type is inactive', 400);
      }
    }

    // Verify member belongs to tenant (using server-resolved tenant_id)
    const { data: member, error: memberError } = await supabase!
      .from('members')
      .select('id, name, tenant_id, status')
      .eq('id', member_id)
      .eq('tenant_id', tenantId)
      .single();

    if (memberError || !member) {
      return errorResponse('Member not found in your organization', 404);
    }

    if (member.status !== 'active') {
      return errorResponse('Cannot create payment for inactive member', 400);
    }

    // Validate against yearly contribution cap
    const currentYear = new Date().getFullYear();
    const { data: yearlySummary, error: capError } = await supabase!
      .rpc('get_member_yearly_summary', {
        _member_id: member_id,
        _tenant_id: tenantId,
        _year: currentYear
      });

    if (!capError && yearlySummary && !yearlySummary.error) {
      const remainingAllowance = Number(yearlySummary.remaining_allowance);
      if (amount > remainingAllowance) {
        // Log rejection
        await supabase!.from('audit_logs').insert({
          action: 'YEARLY_CAP_PAYMENT_REJECTED',
          entity_type: 'payment',
          entity_id: member_id,
          user_id: userId,
          details: {
            tenant_id: tenantId,
            member_id,
            year: currentYear,
            attempted_amount: amount,
            yearly_cap: Number(yearlySummary.yearly_cap),
            total_paid: Number(yearlySummary.total_paid),
            remaining_allowance: remainingAllowance
          }
        });

        return errorResponse(
          `Yearly contribution limit exceeded. Remaining allowance: ৳${remainingAllowance.toLocaleString()}`,
          400,
          {
            code: 'YEARLY_CAP_EXCEEDED',
            yearly_cap: Number(yearlySummary.yearly_cap),
            total_paid: Number(yearlySummary.total_paid),
            remaining_allowance: remainingAllowance
          }
        );
      }
    }

    // Generate unique reference with idempotency component
    const reference = `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Get redirect URLs from request origin
    const origin = req.headers.get('origin') || 'https://somiti.app';
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const successUrl = `${origin}/dashboard/payments/success?ref=${reference}`;
    const cancelUrl = `${origin}/dashboard/payments/cancelled?ref=${reference}`;
    const webhookUrl = `${supabaseUrl}/functions/v1/uddoktapay-webhook`;

    // Create payment record first (pending status) - transactional
    const { data: payment, error: paymentError } = await supabase!
      .from('payments')
      .insert({
        tenant_id: tenantId, // Server-resolved, never from client
        member_id,
        amount,
        payment_type: 'online',
        payment_method: 'other',
        status: 'pending',
        reference,
        period_month,
        period_year,
        contribution_type_id: contribution_type_id || null,
        metadata: {
          ...metadata,
          initiated_by: userId,
          full_name,
          idempotency_key: reference
        }
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Failed to create payment record:', paymentError);
      return errorResponse('Failed to create payment record', 500);
    }

    // Call UddoktaPay API
    const uddoktaPayload = {
      full_name: full_name || member.name,
      email: email || `${member_id}@somiti.app`,
      amount: amount.toString(),
      metadata: {
        payment_id: payment.id,
        tenant_id: tenantId,
        member_id,
        reference
      },
      redirect_url: successUrl,
      cancel_url: cancelUrl,
      webhook_url: webhookUrl
    };

    console.log('Calling UddoktaPay API for payment:', payment.id);

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
      await supabase!
        .from('payments')
        .update({ 
          status: 'failed',
          metadata: { 
            ...payment.metadata, 
            error: uddoktaResult.message || 'Payment gateway error' 
          }
        })
        .eq('id', payment.id);

      // Log failure
      await logPaymentEvent(supabase!, {
        action: 'PAYMENT_FAILED',
        payment_id: payment.id,
        tenant_id: tenantId,
        user_id: userId,
        amount,
        new_status: 'failed',
        details: { gateway_error: uddoktaResult.message }
      });

      return errorResponse(uddoktaResult.message || 'Failed to create payment', 500);
    }

    // Update payment with invoice_id and payment_url
    await supabase!
      .from('payments')
      .update({
        invoice_id: uddoktaResult.invoice_id,
        payment_url: uddoktaResult.payment_url
      })
      .eq('id', payment.id);

    // Log the payment initiation
    await logPaymentEvent(supabase!, {
      action: 'PAYMENT_INITIATED',
      payment_id: payment.id,
      tenant_id: tenantId,
      user_id: userId,
      amount,
      new_status: 'pending',
      details: {
        invoice_id: uddoktaResult.invoice_id,
        member_id,
        period: `${period_month}/${period_year}`
      }
    });

    console.log('Payment created successfully:', {
      payment_id: payment.id,
      invoice_id: uddoktaResult.invoice_id
    });

    return successResponse({
      payment_id: payment.id,
      invoice_id: uddoktaResult.invoice_id,
      payment_url: uddoktaResult.payment_url,
      reference
    });

  } catch (error) {
    console.error('Error in create-payment:', error);
    return errorResponse('Internal server error', 500);
  }
});
