import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { 
  performSecurityCheck, 
  errorResponse, 
  successResponse, 
  corsHeaders 
} from "../_shared/security.ts";
import { logAdminAction } from "../_shared/audit.ts";

interface ReportRequest {
  report_type: 'monthly' | 'yearly' | 'member';
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
    return errorResponse('Method not allowed', 405);
  }

  try {
    // Security check - require admin role and valid subscription
    // Tenant is resolved server-side from user's roles - NEVER trust client
    const securityResult = await performSecurityCheck(req, {
      requireAuth: true,
      requireTenant: true,
      allowedRoles: ['admin'], // Reports are admin-only
      checkSubscription: true,
      rateLimitType: 'api'
    });

    if (!securityResult.success) {
      return errorResponse(securityResult.error!, securityResult.status || 403);
    }

    const { context, supabase } = securityResult;
    const userId = context!.userId;
    const tenantId = context!.tenantId!; // Guaranteed by security check

    // Parse request body - tenant_id NOT accepted from client
    const body: ReportRequest = await req.json();
    const { report_type, start_date, end_date, member_id, format } = body;

    if (!report_type) {
      return errorResponse('report_type is required', 400);
    }

    // Build query - always scoped to user's tenant (server-resolved)
    let query = supabase!
      .from('payments')
      .select('*, members(name, name_bn)')
      .eq('tenant_id', tenantId)
      .eq('status', 'paid')
      .order('payment_date', { ascending: false });

    // Apply date filters
    if (start_date) {
      query = query.gte('payment_date', start_date);
    }
    if (end_date) {
      query = query.lte('payment_date', end_date);
    }

    // Apply member filter (verify member belongs to tenant)
    if (member_id) {
      // First verify member exists in tenant
      const { data: member } = await supabase!
        .from('members')
        .select('id')
        .eq('id', member_id)
        .eq('tenant_id', tenantId)
        .single();

      if (!member) {
        return errorResponse('Member not found in your organization', 404);
      }
      query = query.eq('member_id', member_id);
    }

    const { data: payments, error: paymentsError } = await query;

    if (paymentsError) {
      console.error('Error fetching payments:', paymentsError);
      return errorResponse('Failed to fetch payment data', 500);
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

    // Log report generation
    await logAdminAction(supabase!, {
      user_id: userId,
      tenant_id: tenantId,
      action_description: `Generated ${report_type} report`,
      entity_type: 'payment',
      ip_address: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
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
    return successResponse({
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
    });

  } catch (error) {
    console.error('Error in generate-report:', error);
    return errorResponse('Internal server error', 500);
  }
});
