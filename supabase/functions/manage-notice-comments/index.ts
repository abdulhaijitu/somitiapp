import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EDIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

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

    // Get user role and tenant
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

    if (!tenantId && !isSuperAdmin) {
      return new Response(JSON.stringify({ error: "No tenant" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const method = req.method;
    const url = new URL(req.url);

    // GET: Fetch comments for a notice
    if (method === "GET") {
      const noticeId = url.searchParams.get("notice_id");
      const page = parseInt(url.searchParams.get("page") || "1");
      const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 50);

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

      const offset = (page - 1) * limit;

      const { data: comments, error: commentsError, count } = await supabase
        .from("notice_comments")
        .select("*", { count: "exact" })
        .eq("notice_id", noticeId)
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: true })
        .range(offset, offset + limit - 1);

      if (commentsError) {
        return new Response(JSON.stringify({ error: commentsError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      return new Response(JSON.stringify({
        comments: comments || [],
        total: count || 0,
        page,
        limit,
        has_more: (count || 0) > offset + limit,
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // POST: Add a comment
    if (method === "POST") {
      const payload = await req.json();
      const { notice_id, comment } = payload;

      if (!notice_id || !comment?.trim()) {
        return new Response(JSON.stringify({ error: "notice_id and comment required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Verify notice belongs to tenant
      const { data: notice } = await supabase
        .from("notices")
        .select("id, tenant_id, status")
        .eq("id", notice_id)
        .single();

      if (!notice || (notice.tenant_id !== tenantId && !isSuperAdmin)) {
        return new Response(JSON.stringify({ error: "Notice not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Get user display name
      const userName = user.user_metadata?.full_name || user.email?.split("@")[0] || "User";

      const { data: newComment, error: insertError } = await supabase
        .from("notice_comments")
        .insert({
          notice_id,
          tenant_id: tenantId,
          user_id: user.id,
          user_name: userName,
          user_role: role,
          comment: comment.trim(),
        })
        .select()
        .single();

      if (insertError) {
        return new Response(JSON.stringify({ error: insertError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      return new Response(JSON.stringify({
        comment: newComment,
        message: "Comment added",
        message_bn: "মন্তব্য যোগ করা হয়েছে",
      }), { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // PUT: Edit own comment (within time window)
    if (method === "PUT") {
      const payload = await req.json();
      const { comment_id, comment } = payload;

      if (!comment_id || !comment?.trim()) {
        return new Response(JSON.stringify({ error: "comment_id and comment required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const { data: existing } = await supabase
        .from("notice_comments")
        .select("*")
        .eq("id", comment_id)
        .single();

      if (!existing || (existing.tenant_id !== tenantId && !isSuperAdmin)) {
        return new Response(JSON.stringify({ error: "Comment not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      if (existing.user_id !== user.id && !isSuperAdmin) {
        return new Response(JSON.stringify({ error: "Cannot edit others' comments" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Check time window
      const elapsed = Date.now() - new Date(existing.created_at).getTime();
      if (elapsed > EDIT_WINDOW_MS && !isSuperAdmin) {
        return new Response(JSON.stringify({ error: "Edit window expired (5 minutes)" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const { data: updated, error: updateError } = await supabase
        .from("notice_comments")
        .update({ comment: comment.trim() })
        .eq("id", comment_id)
        .select()
        .single();

      if (updateError) {
        return new Response(JSON.stringify({ error: updateError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      return new Response(JSON.stringify({
        comment: updated,
        message: "Comment updated",
        message_bn: "মন্তব্য আপডেট করা হয়েছে",
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // DELETE: Admin can delete any comment
    if (method === "DELETE") {
      const commentId = url.searchParams.get("id");
      if (!commentId) {
        return new Response(JSON.stringify({ error: "id required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const isAdmin = isSuperAdmin || role === "admin";
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: "Only admins can delete comments" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const { data: existing } = await supabase
        .from("notice_comments")
        .select("id, tenant_id")
        .eq("id", commentId)
        .single();

      if (!existing || (existing.tenant_id !== tenantId && !isSuperAdmin)) {
        return new Response(JSON.stringify({ error: "Comment not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const { error: deleteError } = await supabase
        .from("notice_comments")
        .delete()
        .eq("id", commentId);

      if (deleteError) {
        return new Response(JSON.stringify({ error: deleteError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      return new Response(JSON.stringify({
        success: true,
        message: "Comment deleted",
        message_bn: "মন্তব্য মুছে ফেলা হয়েছে",
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
