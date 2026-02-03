import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AddAdminRequest {
  tenant_id: string;
  admin_email: string;
  admin_password: string;
  admin_name?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify the caller is a super admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - No token provided" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !userData?.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify super_admin role
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "super_admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Forbidden - Super Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: AddAdminRequest = await req.json();

    if (!body.tenant_id || !body.admin_email || !body.admin_password) {
      return new Response(
        JSON.stringify({ error: "tenant_id, admin_email, and admin_password are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check tenant exists
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from("tenants")
      .select("id, name")
      .eq("id", body.tenant_id)
      .maybeSingle();

    if (tenantError || !tenant) {
      return new Response(
        JSON.stringify({ error: "Tenant not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if email already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === body.admin_email.toLowerCase()
    );

    let adminUserId: string;

    if (existingUser) {
      // User exists, just assign role
      adminUserId = existingUser.id;
      console.log("User already exists, assigning role:", adminUserId);
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: body.admin_email,
        password: body.admin_password,
        email_confirm: true,
        user_metadata: { name: body.admin_name || 'Tenant Admin' },
      });

      if (createError) {
        return new Response(
          JSON.stringify({ error: "Failed to create user", details: createError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      adminUserId = newUser.user.id;
      console.log("Created new user:", adminUserId);
    }

    // Check if role already exists
    const { data: existingRole } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", adminUserId)
      .eq("tenant_id", body.tenant_id)
      .maybeSingle();

    if (existingRole) {
      return new Response(
        JSON.stringify({ success: true, message: "Admin role already exists", user_id: adminUserId }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Assign admin role
    const { error: roleError } = await supabaseAdmin.from("user_roles").insert({
      user_id: adminUserId,
      tenant_id: body.tenant_id,
      role: "admin",
    });

    if (roleError) {
      return new Response(
        JSON.stringify({ error: "Failed to assign admin role", details: roleError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Admin added successfully",
        user_id: adminUserId,
        tenant_name: tenant.name
      }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
