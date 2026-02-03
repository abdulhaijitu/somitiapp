import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface UpdateTenantRequest {
  name: string;
  name_bn: string;
  address: string;
}

interface ErrorResponse {
  error: string;
  code?: string;
  details?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed", code: "METHOD_NOT_ALLOWED" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  console.log("=== UPDATE TENANT SETTINGS STARTED ===");

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // 1. Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("No Authorization header provided");
      return new Response(
        JSON.stringify({ error: "Unauthorized - No token provided", code: "UNAUTHORIZED" } as ErrorResponse),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verify user from token
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData?.user) {
      console.error("Token verification failed:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized - Invalid token", code: "INVALID_TOKEN" } as ErrorResponse),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = userData.user.id;
    console.log("Authenticated user:", userId);

    // 2. Resolve tenant from user's role (server-side only - never trust client)
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("tenant_id, role")
      .eq("user_id", userId)
      .in("role", ["admin", "super_admin"])
      .maybeSingle();

    if (roleError) {
      console.error("Role lookup error:", roleError);
      return new Response(
        JSON.stringify({ error: "Failed to verify permissions", code: "ROLE_ERROR" } as ErrorResponse),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!roleData) {
      console.error("User has no admin role");
      return new Response(
        JSON.stringify({ error: "Forbidden - Admin access required", code: "FORBIDDEN" } as ErrorResponse),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tenantId = roleData.tenant_id;
    console.log("Resolved tenant ID:", tenantId);

    if (!tenantId) {
      console.error("No tenant associated with user");
      return new Response(
        JSON.stringify({ error: "No tenant found for user", code: "NO_TENANT" } as ErrorResponse),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Validate subscription status
    const { data: subscription, error: subError } = await supabaseAdmin
      .from("subscriptions")
      .select("status, end_date")
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (subError) {
      console.error("Subscription lookup error:", subError);
      return new Response(
        JSON.stringify({ error: "Failed to verify subscription", code: "SUBSCRIPTION_ERROR" } as ErrorResponse),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!subscription || subscription.status !== "active") {
      console.error("Subscription not active:", subscription?.status);
      return new Response(
        JSON.stringify({ 
          error: "Subscription expired. Settings update is disabled.", 
          code: "SUBSCRIPTION_EXPIRED" 
        } as ErrorResponse),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if subscription has expired by date
    if (new Date(subscription.end_date) < new Date()) {
      console.error("Subscription end date passed:", subscription.end_date);
      return new Response(
        JSON.stringify({ 
          error: "Subscription expired. Settings update is disabled.", 
          code: "SUBSCRIPTION_EXPIRED" 
        } as ErrorResponse),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Parse and validate request body
    let body: UpdateTenantRequest;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body", code: "INVALID_JSON" } as ErrorResponse),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Request body:", { name: body.name, name_bn: body.name_bn, address: body.address });

    // Validate required fields explicitly
    const validationErrors: string[] = [];
    
    if (!body.name || typeof body.name !== "string" || body.name.trim() === "") {
      validationErrors.push("name is required");
    }
    if (!body.name_bn || typeof body.name_bn !== "string" || body.name_bn.trim() === "") {
      validationErrors.push("name_bn (Bengali name) is required");
    }
    if (!body.address || typeof body.address !== "string" || body.address.trim() === "") {
      validationErrors.push("address is required");
    }

    if (validationErrors.length > 0) {
      console.error("Validation errors:", validationErrors);
      return new Response(
        JSON.stringify({ 
          error: "Validation failed", 
          code: "VALIDATION_ERROR",
          details: validationErrors.join(", ")
        } as ErrorResponse),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Update tenant with strict WHERE clause
    console.log("Updating tenant:", tenantId);
    
    const { data: updatedTenant, error: updateError } = await supabaseAdmin
      .from("tenants")
      .update({
        name: body.name.trim(),
        name_bn: body.name_bn.trim(),
        address: body.address.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", tenantId)
      .select()
      .single();

    if (updateError) {
      console.error("Update error:", updateError);
      return new Response(
        JSON.stringify({ 
          error: "Failed to update organization information", 
          code: "UPDATE_ERROR",
          details: updateError.message
        } as ErrorResponse),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!updatedTenant) {
      console.error("No rows affected - tenant may not exist");
      return new Response(
        JSON.stringify({ 
          error: "Update failed - no matching tenant found", 
          code: "NO_ROWS_AFFECTED" 
        } as ErrorResponse),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("=== TENANT UPDATED SUCCESSFULLY ===");
    console.log("Updated tenant:", {
      id: updatedTenant.id,
      name: updatedTenant.name,
      name_bn: updatedTenant.name_bn,
      address: updatedTenant.address,
      updated_at: updatedTenant.updated_at,
    });

    // 6. Log the action for audit
    await supabaseAdmin.from("audit_logs").insert({
      user_id: userId,
      entity_type: "tenant",
      entity_id: tenantId,
      action: "update_settings",
      details: {
        name: updatedTenant.name,
        name_bn: updatedTenant.name_bn,
        address: updatedTenant.address,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Organization information updated successfully",
        data: {
          id: updatedTenant.id,
          name: updatedTenant.name,
          name_bn: updatedTenant.name_bn,
          address: updatedTenant.address,
          updated_at: updatedTenant.updated_at,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("=== UNEXPECTED ERROR ===", error);
    return new Response(
      JSON.stringify({ 
        error: "An unexpected error occurred", 
        code: "INTERNAL_ERROR",
        details: error instanceof Error ? error.message : "Unknown error"
      } as ErrorResponse),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
