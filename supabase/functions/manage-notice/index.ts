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
    const isManager = isAdmin || role === "manager";

    if (!tenantId && !isSuperAdmin) {
      return new Response(JSON.stringify({ error: "No tenant" }), 
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const method = req.method;
    const url = new URL(req.url);

    // GET: Fetch notices
    if (method === "GET") {
      let query = supabase.from("notices").select("*").eq("tenant_id", tenantId)
        .order("is_pinned", { ascending: false }).order("created_at", { ascending: false });

      if (!isManager) query = query.eq("status", "published");

      const { data: notices, error } = await query;
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), 
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      return new Response(JSON.stringify({ notices }), 
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // POST: Create/Update
    if (method === "POST") {
      if (!isManager) {
        return new Response(JSON.stringify({ error: "Permission denied" }), 
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const payload = await req.json();

      if (!payload.title?.trim() || !payload.content?.trim()) {
        return new Response(JSON.stringify({ error: "Title and content required" }), 
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const status = payload.status || "draft";
      if (!isAdmin && status === "published") {
        return new Response(JSON.stringify({ error: "Only admins can publish" }), 
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const noticeData = {
        tenant_id: tenantId,
        title: payload.title.trim(),
        title_bn: payload.title_bn?.trim() || null,
        content: payload.content.trim(),
        content_bn: payload.content_bn?.trim() || null,
        status,
        is_pinned: payload.is_pinned || false,
        published_at: status === "published" ? new Date().toISOString() : null,
      };

      let result;
      if (payload.id) {
        const { data: existing } = await supabase.from("notices").select("id, tenant_id").eq("id", payload.id).single();
        if (!existing || (existing.tenant_id !== tenantId && !isSuperAdmin)) {
          return new Response(JSON.stringify({ error: "Not found or no access" }), 
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const { data, error } = await supabase.from("notices")
          .update({ ...noticeData, updated_at: new Date().toISOString() })
          .eq("id", payload.id).select().single();

        if (error) return new Response(JSON.stringify({ error: error.message }), 
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        result = data;
      } else {
        const { data, error } = await supabase.from("notices")
          .insert({ ...noticeData, created_by: user.id }).select().single();

        if (error) return new Response(JSON.stringify({ error: error.message }), 
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        result = data;
      }

      return new Response(JSON.stringify({ 
        notice: result, 
        message: status === "published" ? "Notice published" : "Draft saved"
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // DELETE
    if (method === "DELETE") {
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: "Only admins can delete" }), 
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const noticeId = url.searchParams.get("id");
      if (!noticeId) {
        return new Response(JSON.stringify({ error: "ID required" }), 
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const { data: existing } = await supabase.from("notices").select("id, tenant_id").eq("id", noticeId).single();
      if (!existing || (existing.tenant_id !== tenantId && !isSuperAdmin)) {
        return new Response(JSON.stringify({ error: "Not found" }), 
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const { error } = await supabase.from("notices").delete().eq("id", noticeId);
      if (error) return new Response(JSON.stringify({ error: error.message }), 
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      return new Response(JSON.stringify({ success: true, message: "Notice deleted" }), 
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), 
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), 
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
