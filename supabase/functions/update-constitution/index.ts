import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders, errorResponse, successResponse } from "../_shared/security.ts";

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Validate auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return errorResponse('Authorization required', 401);
    }

    // Validate user token
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return errorResponse('Invalid or expired token', 401);
    }

    // Create admin client for privileged operations
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get user's tenant and role - SERVER-SIDE RESOLUTION
    const { data: userRole, error: roleError } = await adminClient
      .from('user_roles')
      .select('tenant_id, role')
      .eq('user_id', user.id)
      .single();

    if (roleError || !userRole?.tenant_id) {
      return errorResponse('No tenant association found', 403);
    }

    // Check admin permissions
    const isAdmin = userRole.role === 'admin' || userRole.role === 'super_admin';
    if (!isAdmin) {
      return errorResponse('Only administrators can update the constitution', 403);
    }

    // Parse and validate request body
    const body = await req.json();
    const { content, content_bn } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return errorResponse('Content is required', 400);
    }

    // Upsert constitution for this tenant
    const { data: constitution, error: upsertError } = await adminClient
      .from('constitutions')
      .upsert({
        tenant_id: userRole.tenant_id,
        content: content.trim(),
        content_bn: content_bn?.trim() || null,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'tenant_id'
      })
      .select()
      .single();

    if (upsertError) {
      console.error('Error upserting constitution:', upsertError);
      return errorResponse('Failed to save constitution', 500);
    }

    return successResponse({ constitution });
  } catch (error) {
    console.error('Error in update-constitution:', error);
    return errorResponse('Internal server error', 500);
  }
});
