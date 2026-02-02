import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ReportRequest {
  report_type: 'monthly' | 'yearly' | 'member';
  tenant_id: string;
  start_date?: string;
  end_date?: string;
  member_id?: string;
  format: 'json' | 'csv';
}

interface PaymentData {
  id: string;
  amount: number;
  status: string;
  payment_method: string;
  payment_type: string;
  payment_date: string | null;
  period_month: number | null;
  period_year: number | null;
  created_at: string;
  members: {
    name: string;
    name_bn: string | null;
  } | null;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Verify authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create authenticated client to get user
    const supabaseAuth = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseAuth.auth.getUser(token);
    
    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = userData.user.id;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const body: ReportRequest = await req.json();
    const { report_type, tenant_id, start_date, end_date, member_id, format } = body;

    if (!report_type || !tenant_id) {
      return new Response(
        JSON.stringify({ error: 'report_type and tenant_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user is admin for this tenant
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('tenant_id', tenant_id)
      .in('role', ['admin', 'super_admin'])
      .maybeSingle();

    // Check if super admin
    const { data: isSuperAdmin } = await supabase.rpc('is_super_admin', { _user_id: userId });
    
    if (!userRole && !isSuperAdmin) {
      return new Response(
        JSON.stringify({ error: 'You do not have permission to generate reports' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build query
    let query = supabase
      .from('payments')
      .select('*, members(name, name_bn)')
      .eq('tenant_id', tenant_id)
      .eq('status', 'paid')
      .order('payment_date', { ascending: false });

    // Apply date filters
    if (start_date) {
      query = query.gte('payment_date', start_date);
    }
    if (end_date) {
      query = query.lte('payment_date', end_date);
    }

    // Apply member filter
    if (member_id) {
      query = query.eq('member_id', member_id);
    }

    const { data: payments, error: paymentsError } = await query;

    if (paymentsError) {
      console.error('Error fetching payments:', paymentsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch payment data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const paymentsData = payments as PaymentData[];

    // Calculate summary
    const summary = {
      total_amount: paymentsData.reduce((sum, p) => sum + Number(p.amount), 0),
      total_count: paymentsData.length,
      by_method: {} as Record<string, { count: number; amount: number }>,
      by_type: {} as Record<string, { count: number; amount: number }>,
      by_month: {} as Record<string, { count: number; amount: number }>
    };

    paymentsData.forEach(p => {
      // By method
      if (!summary.by_method[p.payment_method]) {
        summary.by_method[p.payment_method] = { count: 0, amount: 0 };
      }
      summary.by_method[p.payment_method].count++;
      summary.by_method[p.payment_method].amount += Number(p.amount);

      // By type
      if (!summary.by_type[p.payment_type]) {
        summary.by_type[p.payment_type] = { count: 0, amount: 0 };
      }
      summary.by_type[p.payment_type].count++;
      summary.by_type[p.payment_type].amount += Number(p.amount);

      // By month
      const monthKey = p.period_month && p.period_year 
        ? `${p.period_year}-${String(p.period_month).padStart(2, '0')}`
        : p.payment_date?.substring(0, 7) || 'unknown';
      
      if (!summary.by_month[monthKey]) {
        summary.by_month[monthKey] = { count: 0, amount: 0 };
      }
      summary.by_month[monthKey].count++;
      summary.by_month[monthKey].amount += Number(p.amount);
    });

    // Generate report based on format
    if (format === 'csv') {
      // Generate CSV
      const headers = ['Date', 'Member', 'Amount', 'Method', 'Type', 'Period', 'Transaction ID'];
      const rows = paymentsData.map(p => [
        p.payment_date || p.created_at,
        p.members?.name || 'Unknown',
        p.amount.toString(),
        p.payment_method,
        p.payment_type,
        p.period_month && p.period_year ? `${p.period_month}/${p.period_year}` : '-',
        p.id.substring(0, 8)
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      return new Response(csvContent, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="report-${report_type}-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    // Return JSON report
    return new Response(
      JSON.stringify({
        success: true,
        report_type,
        generated_at: new Date().toISOString(),
        filters: {
          start_date,
          end_date,
          member_id
        },
        summary,
        payments: paymentsData.map(p => ({
          id: p.id,
          date: p.payment_date || p.created_at,
          member_name: p.members?.name,
          member_name_bn: p.members?.name_bn,
          amount: p.amount,
          method: p.payment_method,
          type: p.payment_type,
          period: p.period_month && p.period_year ? `${p.period_month}/${p.period_year}` : null
        }))
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-report:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
