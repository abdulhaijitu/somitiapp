import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NoticePayload {
  id?: string;
  title: string;
  title_bn?: string;
  content: string;
  content_bn?: string;
  status?: "draft" | "published";
  is_pinned?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization header required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's token to get user info
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role for privileged operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user's tenant and role
    const { data: userRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("role, tenant_id")
      .eq("user_id", user.id);

    if (rolesError || !userRoles || userRoles.length === 0) {
      return new Response(
        JSON.stringify({ error: "User has no roles assigned" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userRole = userRoles[0];
    const tenantId = userRole.tenant_id;
    const role = userRole.role;
    const isSuperAdmin = role === "super_admin";
    const isAdmin = isSuperAdmin || role === "admin";
    const isManager = isAdmin || role === "manager";

    if (!tenantId && !isSuperAdmin) {
      return new Response(
        JSON.stringify({ error: "No tenant associated with user" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const method = req.method;
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // GET: Fetch notices
    if (method === "GET") {
      let query = supabase
        .from("notices")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });

      // Members only see published notices
      if (!isManager) {
        query = query.eq("status", "published");
      }

      const { data: notices, error: fetchError } = await query;

      if (fetchError) {
        return new Response(
          JSON.stringify({ error: fetchError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ notices }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST: Create or update notice
    if (method === "POST") {
      if (!isManager) {
        return new Response(
          JSON.stringify({ error: "Only admins and managers can create notices" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const payload: NoticePayload = await req.json();

      // Validation
      if (!payload.title || !payload.title.trim()) {
        return new Response(
          JSON.stringify({ error: "Title is required", error_bn: "শিরোনাম আবশ্যক" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!payload.content || !payload.content.trim()) {
        return new Response(
          JSON.stringify({ error: "Content is required", error_bn: "বিষয়বস্তু আবশ্যক" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Managers can only save drafts
      const status = payload.status || "draft";
      if (!isAdmin && status === "published") {
        return new Response(
          JSON.stringify({ error: "Only admins can publish notices", error_bn: "শুধুমাত্র অ্যাডমিন নোটিশ প্রকাশ করতে পারেন" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
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
        // Update existing notice
        // Verify notice belongs to this tenant
        const { data: existing, error: existError } = await supabase
          .from("notices")
          .select("id, tenant_id")
          .eq("id", payload.id)
          .single();

        if (existError || !existing) {
          return new Response(
            JSON.stringify({ error: "Notice not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (existing.tenant_id !== tenantId && !isSuperAdmin) {
          return new Response(
            JSON.stringify({ error: "Cannot update notice from another tenant" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data, error } = await supabase
          .from("notices")
          .update({
            ...noticeData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", payload.id)
          .select()
          .single();

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        result = data;
      } else {
        // Create new notice
        const { data, error } = await supabase
          .from("notices")
          .insert({
            ...noticeData,
            created_by: user.id,
          })
          .select()
          .single();

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        result = data;
      }

      return new Response(
        JSON.stringify({ 
          notice: result, 
          message: status === "published" ? "Notice published successfully" : "Notice saved as draft",
          message_bn: status === "published" ? "নোটিশ সফলভাবে প্রকাশিত হয়েছে" : "নোটিশ ড্রাফট হিসেবে সংরক্ষিত হয়েছে"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // DELETE: Delete notice
    if (method === "DELETE") {
      if (!isAdmin) {
        return new Response(
          JSON.stringify({ error: "Only admins can delete notices" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const noticeId = url.searchParams.get("id");
      if (!noticeId) {
        return new Response(
          JSON.stringify({ error: "Notice ID required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify notice belongs to this tenant
      const { data: existing, error: existError } = await supabase
        .from("notices")
        .select("id, tenant_id")
        .eq("id", noticeId)
        .single();

      if (existError || !existing) {
        return new Response(
          JSON.stringify({ error: "Notice not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (existing.tenant_id !== tenantId && !isSuperAdmin) {
        return new Response(
          JSON.stringify({ error: "Cannot delete notice from another tenant" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error } = await supabase
        .from("notices")
        .delete()
        .eq("id", noticeId);

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Notice deleted successfully",
          message_bn: "নোটিশ সফলভাবে মুছে ফেলা হয়েছে"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in manage-notice:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
