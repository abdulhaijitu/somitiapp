import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("role, tenant_id")
      .eq("user_id", user.id);

    if (!userRoles || userRoles.length === 0) {
      return new Response(JSON.stringify({ error: "No roles assigned" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { tenant_id: tenantId, role } = userRoles[0];
    const isSuperAdmin = role === "super_admin";
    const isAdmin = isSuperAdmin || role === "admin";

    if (!tenantId && !isSuperAdmin) {
      return new Response(JSON.stringify({ error: "No tenant" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const method = req.method;
    const url = new URL(req.url);

    // GET: Fetch decision for a notice
    if (method === "GET") {
      const noticeId = url.searchParams.get("notice_id");
      if (!noticeId) {
        return new Response(JSON.stringify({ error: "notice_id required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Verify notice belongs to tenant
      const { data: notice } = await supabase
        .from("notices")
        .select("id, tenant_id")
        .eq("id", noticeId)
        .single();

      if (!notice || (notice.tenant_id !== tenantId && !isSuperAdmin)) {
        return new Response(JSON.stringify({ error: "Notice not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const { data: decision } = await supabase
        .from("notice_decisions")
        .select("*")
        .eq("notice_id", noticeId)
        .eq("tenant_id", tenantId)
        .maybeSingle();

      return new Response(JSON.stringify({ decision: decision || null }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // POST: Set or update decision (Admin only)
    if (method === "POST") {
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: "Only admins can set decisions" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const payload = await req.json();
      const { notice_id, status, decision_text } = payload;

      if (!notice_id || !status || !decision_text?.trim()) {
        return new Response(JSON.stringify({ error: "notice_id, status, and decision_text required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      if (!["approved", "rejected", "deferred"].includes(status)) {
        return new Response(JSON.stringify({ error: "Invalid status. Use: approved, rejected, deferred" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Verify notice belongs to tenant
      const { data: notice } = await supabase
        .from("notices")
        .select("id, tenant_id")
        .eq("id", notice_id)
        .single();

      if (!notice || (notice.tenant_id !== tenantId && !isSuperAdmin)) {
        return new Response(JSON.stringify({ error: "Notice not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const userName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Admin";

      // Upsert decision (one per notice)
      const { data: existing } = await supabase
        .from("notice_decisions")
        .select("id")
        .eq("notice_id", notice_id)
        .maybeSingle();

      let result;
      if (existing) {
        const { data, error } = await supabase
          .from("notice_decisions")
          .update({
            status,
            decision_text: decision_text.trim(),
            decided_by: user.id,
            decided_by_name: userName,
            decided_at: new Date().toISOString(),
          })
          .eq("id", existing.id)
          .select()
          .single();

        if (error) {
          return new Response(JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        result = data;
      } else {
        const { data, error } = await supabase
          .from("notice_decisions")
          .insert({
            notice_id,
            tenant_id: tenantId,
            status,
            decision_text: decision_text.trim(),
            decided_by: user.id,
            decided_by_name: userName,
          })
          .select()
          .single();

        if (error) {
          return new Response(JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        result = data;
      }

      return new Response(JSON.stringify({
        decision: result,
        message: "Decision saved",
        message_bn: "সিদ্ধান্ত সংরক্ষিত হয়েছে",
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
