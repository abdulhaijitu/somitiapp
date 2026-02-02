import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-tenant-subdomain, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();

    // POST /validate-tenant - Validate tenant and subscription
    if (req.method === 'POST') {
      const body = await req.json();
      const { subdomain, tenant_id } = body;
      
      if (!subdomain && !tenant_id) {
        return new Response(
          JSON.stringify({ 
            valid: false, 
            error: 'Either subdomain or tenant_id is required' 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      let tenant;
      
      if (subdomain) {
        // Get tenant by subdomain
        const { data, error } = await supabase
          .from('tenants')
          .select('*, subscriptions(*)')
          .eq('subdomain', subdomain)
          .neq('status', 'deleted')
          .single();
        
        if (error || !data) {
          console.log('Tenant not found for subdomain:', subdomain, error);
          return new Response(
            JSON.stringify({ 
              valid: false, 
              error: 'Tenant not found' 
            }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        tenant = data;
      } else {
        // Get tenant by ID
        const { data, error } = await supabase
          .from('tenants')
          .select('*, subscriptions(*)')
          .eq('id', tenant_id)
          .neq('status', 'deleted')
          .single();
        
        if (error || !data) {
          console.log('Tenant not found for ID:', tenant_id, error);
          return new Response(
            JSON.stringify({ 
              valid: false, 
              error: 'Tenant not found' 
            }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        tenant = data;
      }
      
      // Check tenant status
      if (tenant.status === 'suspended') {
        console.log('Tenant suspended:', tenant.id);
        return new Response(
          JSON.stringify({ 
            valid: false, 
            error: 'Your organization has been suspended. Please contact support.',
            code: 'TENANT_SUSPENDED'
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Check subscription
      const subscription = tenant.subscriptions;
      
      if (!subscription) {
        console.log('No subscription for tenant:', tenant.id);
        return new Response(
          JSON.stringify({ 
            valid: false, 
            error: 'No active subscription found. Please renew your subscription.',
            code: 'NO_SUBSCRIPTION'
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (subscription.status !== 'active') {
        console.log('Subscription not active for tenant:', tenant.id);
        return new Response(
          JSON.stringify({ 
            valid: false, 
            error: 'Your subscription is not active. Please renew your subscription.',
            code: 'SUBSCRIPTION_INACTIVE'
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const endDate = new Date(subscription.end_date);
      const now = new Date();
      
      if (endDate < now) {
        console.log('Subscription expired for tenant:', tenant.id);
        
        // Update subscription status to expired
        await supabase
          .from('subscriptions')
          .update({ status: 'expired' })
          .eq('id', subscription.id);
        
        return new Response(
          JSON.stringify({ 
            valid: false, 
            error: 'Your subscription has expired. Please renew to continue.',
            code: 'SUBSCRIPTION_EXPIRED',
            expired_at: subscription.end_date
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Calculate days remaining
      const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      console.log('Tenant validated successfully:', tenant.id, 'Days remaining:', daysRemaining);
      
      return new Response(
        JSON.stringify({
          valid: true,
          tenant_id: tenant.id,
          tenant_name: tenant.name,
          tenant_subdomain: tenant.subdomain,
          subscription: {
            plan: subscription.plan,
            status: subscription.status,
            end_date: subscription.end_date,
            days_remaining: daysRemaining,
            is_expiring_soon: daysRemaining <= 7
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /validate-tenant?subdomain=xxx - Get tenant info
    if (req.method === 'GET') {
      const subdomain = url.searchParams.get('subdomain');
      
      if (!subdomain) {
        return new Response(
          JSON.stringify({ error: 'subdomain query parameter is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const { data: tenant, error } = await supabase
        .from('tenants')
        .select('id, name, name_bn, subdomain, default_language, status')
        .eq('subdomain', subdomain)
        .neq('status', 'deleted')
        .single();
      
      if (error || !tenant) {
        return new Response(
          JSON.stringify({ error: 'Tenant not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify(tenant),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in validate-tenant function:', error);
    return new Response(
      JSON.stringify({ 
        valid: false, 
        error: 'Internal server error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
