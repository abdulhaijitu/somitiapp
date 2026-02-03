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
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create admin client with service role key (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Parse request body
    const body: CreateTenantRequest = await req.json();

    // Validation
    if (!body.name || !body.subdomain) {
      return new Response(
        JSON.stringify({ error: "Name and subdomain are required" }),
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

    // Create tenant_usage record
    await supabaseAdmin.from("tenant_usage").insert({
      tenant_id: tenant.id,
      member_count: 0,
      sms_used_this_month: 0,
      total_sms_sent: 0,
    });

    // Log the action
    await supabaseAdmin.from("audit_logs").insert({
      action: "CREATE_TENANT",
      entity_type: "tenant",
      entity_id: tenant.id,
      details: {
        name: body.name,
        subdomain: body.subdomain,
        subscription_months: body.subscription_months,
        plan: body.plan || "standard",
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
