import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders, successResponse, errorResponse } from "../_shared/security.ts";

/**
 * Edge Function: check-plan-limit
 * Server-side enforcement of plan-based limits
 * 
 * Supported limit types:
 * - add_member: Check if tenant can add more members
 * - send_sms: Check if tenant has SMS quota remaining
 * - online_payment: Check if online payments are enabled
 * - advanced_reports: Check if advanced reports are available
 */

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return errorResponse('Authorization required', 401);
    }

    // Verify the user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return errorResponse('Invalid token', 401);
    }

    // Get tenant from user's role
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single();

    if (roleError || !userRole?.tenant_id) {
      return errorResponse('User not associated with any tenant', 403);
    }

    const tenantId = userRole.tenant_id;

    // Parse request body
    const body = await req.json();
    const { limit_type } = body;

    if (!limit_type) {
      return errorResponse('limit_type is required', 400);
    }

    const validLimitTypes = ['add_member', 'send_sms', 'online_payment', 'advanced_reports'];
    if (!validLimitTypes.includes(limit_type)) {
      return errorResponse(`Invalid limit_type. Must be one of: ${validLimitTypes.join(', ')}`, 400);
    }

    // Call the database function to check limits
    const { data: result, error: checkError } = await supabase
      .rpc('check_tenant_limit', {
        _tenant_id: tenantId,
        _limit_type: limit_type
      });

    if (checkError) {
      console.error('Error checking limit:', checkError);
      return errorResponse('Failed to check plan limit', 500);
    }

    // If not allowed, return 403 with helpful message
    if (!result.allowed) {
      return new Response(
        JSON.stringify({
          success: false,
          allowed: false,
          ...result
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return successResponse({
      allowed: true,
      limit_type,
      plan: result.plan,
      current_usage: result.current_usage,
      max_limit: result.max_limit
    });

  } catch (error) {
    console.error('Error in check-plan-limit:', error);
    return errorResponse('Internal server error', 500);
  }
});
