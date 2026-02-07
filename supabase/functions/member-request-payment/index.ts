import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders, errorResponse, successResponse } from "../_shared/security.ts";

interface PaymentRequest {
  due_id: string;
  amount: number;
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Get auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return errorResponse('Authorization required', 401);
    }

    // Create client with user's token to get user info
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return errorResponse('Invalid authentication', 401);
    }

    // Create admin client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request
    const body: PaymentRequest = await req.json();
    const { due_id, amount } = body;

    if (!due_id || !amount || amount <= 0) {
      return errorResponse('due_id and valid amount are required', 400);
    }

    // Get the due and verify member access
    const { data: due, error: dueError } = await supabase
      .from('dues')
      .select(`
        id, amount, paid_amount, status, due_month, tenant_id, member_id,
        contribution_type:contribution_types(id, name),
        member:members(id, name, phone, email, tenant_id)
      `)
      .eq('id', due_id)
      .single();

    if (dueError || !due) {
      console.error('Due not found:', dueError);
      return errorResponse('Due not found', 404);
    }

    // Verify the user is the member (by email or phone)
    const memberData = due.member as unknown as { id: string; name: string; phone: string | null; email: string | null; tenant_id: string } | null;
    if (!memberData) {
      return errorResponse('Member not found', 404);
    }
    
    const memberEmail = memberData.email;
    const memberPhone = memberData.phone;
    
    const userEmail = user.email;
    const userPhone = user.phone;

    const isAuthorized = 
      (memberEmail && userEmail && memberEmail.toLowerCase() === userEmail.toLowerCase()) ||
      (memberPhone && userPhone && memberPhone === userPhone);

    if (!isAuthorized) {
      console.error('Unauthorized: User does not match member', { userEmail, userPhone, memberEmail, memberPhone });
      return errorResponse('You are not authorized to request payment for this due', 403);
    }

    // Check if tenant has online payments enabled
    const { data: planLimits } = await supabase.rpc('check_tenant_limit', {
      _tenant_id: due.tenant_id,
      _limit_type: 'online_payment'
    });

    if (planLimits && !planLimits.allowed) {
      return errorResponse(planLimits.message || 'Online payments not available on current plan', 403);
    }

    // Calculate remaining amount
    const remaining = Number(due.amount) - Number(due.paid_amount);
    if (amount > remaining) {
      return errorResponse(`Amount cannot exceed remaining due: ৳${remaining}`, 400);
    }

    // Check for existing paid payment for this due
    const { data: paidPayment } = await supabase
      .from('payments')
      .select('id')
      .eq('due_id', due_id)
      .eq('status', 'paid')
      .maybeSingle();

    if (paidPayment) {
      return errorResponse('This due has already been paid', 400);
    }

    // Check for existing pending payment request for this due
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id, status, metadata')
      .eq('due_id', due_id)
      .eq('status', 'pending')
      .maybeSingle();

    if (existingPayment) {
      const metadata = existingPayment.metadata as Record<string, unknown> | null;
      if (metadata?.member_requested && !metadata?.admin_approved) {
        return errorResponse('A payment request is already pending approval', 400);
      }
    }

    // Create payment record with pending status and metadata for approval
    const reference = `MREQ-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const dueMonth = new Date(due.due_month + '-01');
    
    const contributionType = due.contribution_type as unknown as { id: string; name: string } | null;

    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        tenant_id: due.tenant_id,
        member_id: due.member_id,
        due_id: due_id,
        amount: amount,
        payment_type: 'online',
        payment_method: 'other',
        status: 'pending',
        reference,
        period_month: dueMonth.getMonth() + 1,
        period_year: dueMonth.getFullYear(),
        contribution_type_id: contributionType?.id || null,
        metadata: {
          member_requested: true,
          admin_approved: false,
          requested_at: new Date().toISOString(),
          requested_by_user_id: user.id,
          member_name: memberData.name,
          due_month: due.due_month
        }
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Failed to create payment request:', paymentError);
      return errorResponse('Failed to create payment request', 500);
    }

    // Create notification for admin
    await supabase.from('notifications').insert({
      tenant_id: due.tenant_id,
      notification_type: 'admin_alert',
      title: 'New Payment Request',
      title_bn: 'নতুন পেমেন্ট রিকোয়েস্ট',
      message: `${memberData.name} has requested to pay ৳${amount} for ${due.due_month}`,
      message_bn: `${memberData.name} ${due.due_month} এর জন্য ৳${amount} পরিশোধ করতে চাইছেন`,
      data: {
        type: 'payment_request',
        payment_id: payment.id,
        member_id: memberData.id,
        amount: amount
      }
    });

    console.log('Payment request created:', payment.id);

    return successResponse({
      payment_id: payment.id,
      reference,
      status: 'pending_approval',
      message: 'Payment request submitted. Waiting for admin approval.'
    });

  } catch (error) {
    console.error('Error in member-request-payment:', error);
    return errorResponse('Internal server error', 500);
  }
});
