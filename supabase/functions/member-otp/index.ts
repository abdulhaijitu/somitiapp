import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OTPRequest {
  action: 'send' | 'verify'
  phone: string
  otp?: string
  tenant_subdomain?: string
}

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
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

    const { action, phone, otp, tenant_subdomain } = await req.json() as OTPRequest

    if (!phone) {
      return new Response(
        JSON.stringify({ success: false, error: 'Phone number is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Normalize phone number (Bangladesh format)
    const normalizedPhone = phone.replace(/\D/g, '').replace(/^880/, '').replace(/^0/, '')
    const fullPhone = `+880${normalizedPhone}`

    if (action === 'send') {
      // Find member by phone number
      const { data: member, error: memberError } = await supabaseAdmin
        .from('members')
        .select('id, name, tenant_id, status, tenants!inner(subdomain, status)')
        .or(`phone.eq.${phone},phone.eq.${fullPhone},phone.eq.0${normalizedPhone},phone.eq.${normalizedPhone}`)
        .maybeSingle()

      if (memberError) {
        console.error('Member lookup error:', memberError)
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to verify phone number' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!member) {
        return new Response(
          JSON.stringify({ success: false, error: 'No member found with this phone number', error_bn: 'এই ফোন নম্বরে কোনো সদস্য পাওয়া যায়নি' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (member.status !== 'active') {
        return new Response(
          JSON.stringify({ success: false, error: 'Member account is not active', error_bn: 'সদস্য অ্যাকাউন্ট সক্রিয় নয়' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check tenant status
      const tenant = member.tenants as any
      if (tenant?.status !== 'active') {
        return new Response(
          JSON.stringify({ success: false, error: 'Organization is not active', error_bn: 'সংগঠন সক্রিয় নয়' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check rate limiting
      const rateLimitWindow = new Date(Date.now() - 60 * 1000) // 1 minute window
      const { data: rateLimit } = await supabaseAdmin
        .from('sms_rate_limits')
        .select('request_count, window_start')
        .eq('phone_number', fullPhone)
        .eq('notification_type', 'otp')
        .gte('window_start', rateLimitWindow.toISOString())
        .maybeSingle()

      if (rateLimit && rateLimit.request_count >= 3) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Too many OTP requests. Please wait before trying again.',
            error_bn: 'অনেক বেশি OTP অনুরোধ। আবার চেষ্টা করার আগে অপেক্ষা করুন।',
            retry_after: 60 
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Generate OTP and store it
      const otpCode = generateOTP()
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

      // Store OTP in metadata (using sms_logs with pending status)
      await supabaseAdmin.from('sms_logs').insert({
        tenant_id: member.tenant_id,
        member_id: member.id,
        phone_number: fullPhone,
        notification_type: 'otp',
        message: `Your OTP is: ${otpCode}`,
        status: 'pending',
        provider: 'demo', // In production, use actual SMS provider
        provider_message_id: otpCode, // Store OTP here temporarily
        idempotency_key: `otp_${member.id}_${Date.now()}`
      })

      // Update rate limit
      await supabaseAdmin.from('sms_rate_limits').upsert({
        phone_number: fullPhone,
        notification_type: 'otp',
        request_count: (rateLimit?.request_count || 0) + 1,
        window_start: rateLimit?.window_start || new Date().toISOString()
      }, {
        onConflict: 'phone_number,notification_type'
      })

      // In production, send actual SMS here
      // For demo, we'll log the OTP
      console.log(`[DEMO] OTP for ${fullPhone}: ${otpCode}`)

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'OTP sent successfully',
          message_bn: 'OTP সফলভাবে পাঠানো হয়েছে',
          tenant_subdomain: tenant.subdomain,
          member_name: member.name,
          // For demo purposes only - remove in production!
          demo_otp: otpCode
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'verify') {
      if (!otp) {
        return new Response(
          JSON.stringify({ success: false, error: 'OTP is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Find the OTP entry
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
      const { data: otpEntry, error: otpError } = await supabaseAdmin
        .from('sms_logs')
        .select('id, member_id, tenant_id, provider_message_id, created_at')
        .eq('notification_type', 'otp')
        .eq('status', 'pending')
        .eq('provider_message_id', otp) // OTP stored here
        .or(`phone_number.eq.${phone},phone_number.eq.${fullPhone}`)
        .gte('created_at', fiveMinutesAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (otpError || !otpEntry) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid or expired OTP', error_bn: 'অবৈধ বা মেয়াদোত্তীর্ণ OTP' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Mark OTP as used
      await supabaseAdmin
        .from('sms_logs')
        .update({ status: 'delivered', delivered_at: new Date().toISOString() })
        .eq('id', otpEntry.id)

      // Get member details
      const { data: member } = await supabaseAdmin
        .from('members')
        .select('id, name, email, phone, user_id, tenant_id')
        .eq('id', otpEntry.member_id)
        .single()

      if (!member) {
        return new Response(
          JSON.stringify({ success: false, error: 'Member not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      let authUserId = member.user_id

      // If member doesn't have auth account, create one
      if (!authUserId) {
        // Create auth user with phone
        const tempEmail = `member_${member.id}@somiti.local`
        const tempPassword = crypto.randomUUID()

        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: tempEmail,
          password: tempPassword,
          email_confirm: true,
          phone: fullPhone,
          phone_confirm: true,
          user_metadata: {
            member_id: member.id,
            name: member.name,
            is_member: true
          }
        })

        if (createError) {
          console.error('Failed to create auth user:', createError)
          return new Response(
            JSON.stringify({ success: false, error: 'Failed to create account' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        authUserId = newUser.user.id

        // Link member to auth user
        await supabaseAdmin
          .from('members')
          .update({ user_id: authUserId })
          .eq('id', member.id)

        // Create member role
        await supabaseAdmin.from('user_roles').insert({
          user_id: authUserId,
          tenant_id: member.tenant_id,
          role: 'member'
        })
      }

      // Generate session for the user
      const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: `member_${member.id}@somiti.local`,
        options: {
          redirectTo: '/member'
        }
      })

      if (sessionError) {
        console.error('Failed to generate session:', sessionError)
      }

      // Create a session directly
      // Since we can't easily create a session, let's use a different approach
      // We'll return a one-time token that the client can exchange

      // Generate a magic link token
      const tokenHash = crypto.randomUUID()
      
      // Store token temporarily (using notifications table as temp storage)
      await supabaseAdmin.from('notifications').insert({
        tenant_id: member.tenant_id,
        member_id: member.id,
        user_id: authUserId,
        notification_type: 'system_alert',
        title: 'Session Token',
        message: tokenHash,
        data: { 
          type: 'session_token',
          expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
          user_id: authUserId
        }
      })

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'OTP verified successfully',
          message_bn: 'OTP সফলভাবে যাচাই হয়েছে',
          session_token: tokenHash,
          user_id: authUserId,
          member_id: member.id
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Member OTP error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
