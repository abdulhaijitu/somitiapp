import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { session_token, user_id } = await req.json()

    if (!session_token || !user_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Find the token in notifications
    const { data: tokenEntry, error: tokenError } = await supabaseAdmin
      .from('notifications')
      .select('id, data, created_at, user_id')
      .eq('message', session_token)
      .eq('title', 'Session Token')
      .eq('user_id', user_id)
      .eq('is_read', false)
      .maybeSingle()

    if (tokenError || !tokenEntry) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or expired token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check expiration
    const tokenData = tokenEntry.data as any
    if (new Date(tokenData.expires_at) < new Date()) {
      // Mark as read (used)
      await supabaseAdmin
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', tokenEntry.id)

      return new Response(
        JSON.stringify({ success: false, error: 'Token expired' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Mark token as used
    await supabaseAdmin
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', tokenEntry.id)

    // Get user details
    const { data: authUser, error: userError } = await supabaseAdmin.auth.admin.getUserById(user_id)

    if (userError || !authUser.user) {
      return new Response(
        JSON.stringify({ success: false, error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate a proper session using signInWithPassword for the user
    // Since we created the user with a random password, we need to update it first
    const newPassword = crypto.randomUUID()
    
    await supabaseAdmin.auth.admin.updateUserById(user_id, {
      password: newPassword
    })

    // Now we return credentials for the client to sign in
    // The client will use these to create a proper session
    return new Response(
      JSON.stringify({ 
        success: true,
        email: authUser.user.email,
        password: newPassword,
        user_id: user_id
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Member session error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
