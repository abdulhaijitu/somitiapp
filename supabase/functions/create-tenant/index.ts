import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateTenantRequest {
  name: string;
  name_bn?: string;
  subdomain: string;
  default_language: string;
  subscription_months: number;
  plan?: string;
  // Admin user info
  admin_email: string;
  admin_password: string;
  admin_name?: string;
  admin_phone?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify the caller is a super admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - No token provided" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin client with service role key (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify the JWT using admin client
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !userData?.user) {
      console.error("Token verification error:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized - Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = userData.user.id;

    // Verify user has super_admin role
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "super_admin")
      .maybeSingle();

    if (roleError || !roleData) {
      console.error("Role check error:", roleError);
      return new Response(
        JSON.stringify({ error: "Forbidden - Super Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body: CreateTenantRequest = await req.json();

    // Validation
    if (!body.name || !body.subdomain) {
      return new Response(
        JSON.stringify({ error: "Name and subdomain are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!body.admin_email || !body.admin_password) {
      return new Response(
        JSON.stringify({ error: "Admin email and password are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate subdomain format
    const subdomainRegex = /^[a-z0-9-]+$/;
    if (!subdomainRegex.test(body.subdomain)) {
      return new Response(
        JSON.stringify({ error: "Subdomain must contain only lowercase letters, numbers, and hyphens" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if subdomain already exists
    const { data: existing } = await supabaseAdmin
      .from("tenants")
      .select("id")
      .eq("subdomain", body.subdomain.toLowerCase())
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ error: "This subdomain is already taken" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if admin email already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const emailExists = existingUsers?.users?.some(
      (u) => u.email?.toLowerCase() === body.admin_email.toLowerCase()
    );

    if (emailExists) {
      return new Response(
        JSON.stringify({ error: "This email is already registered" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create tenant
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from("tenants")
      .insert({
        name: body.name,
        name_bn: body.name_bn || null,
        subdomain: body.subdomain.toLowerCase(),
        default_language: body.default_language || "en",
        status: "active",
      })
      .select()
      .single();

    if (tenantError) {
      console.error("Error creating tenant:", tenantError);
      return new Response(
        JSON.stringify({ error: "Failed to create tenant", details: tenantError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Tenant created:", tenant.id);

    // Create subscription
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + (body.subscription_months || 1));

    const { error: subscriptionError } = await supabaseAdmin
      .from("subscriptions")
      .insert({
        tenant_id: tenant.id,
        plan: body.plan || "standard",
        status: "active",
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      });

    if (subscriptionError) {
      console.error("Error creating subscription:", subscriptionError);
      // Rollback tenant creation
      await supabaseAdmin.from("tenants").delete().eq("id", tenant.id);
      return new Response(
        JSON.stringify({ error: "Failed to create subscription", details: subscriptionError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Subscription created for tenant:", tenant.id);

    // Create tenant_usage record
    await supabaseAdmin.from("tenant_usage").insert({
      tenant_id: tenant.id,
      member_count: 0,
      sms_used_this_month: 0,
      total_sms_sent: 0,
    });

    // Create admin user in Supabase Auth
    console.log("Creating admin user:", body.admin_email);
    const { data: adminUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: body.admin_email,
      password: body.admin_password,
      email_confirm: true,
      user_metadata: {
        name: body.admin_name || 'Tenant Admin',
        phone: body.admin_phone || null,
      },
    });

    if (authError) {
      console.error("Error creating admin user:", authError);
      // Rollback tenant creation
      await supabaseAdmin.from("subscriptions").delete().eq("tenant_id", tenant.id);
      await supabaseAdmin.from("tenant_usage").delete().eq("tenant_id", tenant.id);
      await supabaseAdmin.from("tenants").delete().eq("id", tenant.id);
      return new Response(
        JSON.stringify({ error: "Failed to create admin user", details: authError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Admin user created:", adminUser.user.id);

    // Assign admin role to the user
    const { error: roleError2 } = await supabaseAdmin.from("user_roles").insert({
      user_id: adminUser.user.id,
      tenant_id: tenant.id,
      role: "admin",
    });

    if (roleError2) {
      console.error("Error assigning admin role:", roleError2);
      // Rollback everything
      await supabaseAdmin.auth.admin.deleteUser(adminUser.user.id);
      await supabaseAdmin.from("subscriptions").delete().eq("tenant_id", tenant.id);
      await supabaseAdmin.from("tenant_usage").delete().eq("tenant_id", tenant.id);
      await supabaseAdmin.from("tenants").delete().eq("id", tenant.id);
      return new Response(
        JSON.stringify({ error: "Failed to assign admin role", details: roleError2.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Admin role assigned to user:", adminUser.user.id);

    // Log the action
    await supabaseAdmin.from("audit_logs").insert({
      action: "CREATE_TENANT",
      entity_type: "tenant",
      entity_id: tenant.id,
      user_id: userId,
      details: {
        name: body.name,
        subdomain: body.subdomain,
        subscription_months: body.subscription_months,
        plan: body.plan || "standard",
        admin_email: body.admin_email,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        tenant: tenant,
        message: "Tenant created successfully",
      }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
