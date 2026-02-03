import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { SkeletonLoader } from '@/components/ui/skeleton-loader';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DollarSign,
  TrendingUp,
  Users,
  CreditCard,
  PieChart,
  Building2,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { PieChart as ReChartPie, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { format, subDays } from 'date-fns';

interface RevenueStats {
  totalActiveTenants: number;
  totalPayingTenants: number;
  monthlyRecurringRevenue: number;
  planDistribution: { plan: string; count: number; revenue: number }[];
  recentSubscriptions: any[];
  addonRevenue: number;
}

export function RevenueDashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['revenue-stats'],
    queryFn: async (): Promise<RevenueStats> => {
      // Get all active subscriptions with tenants
      const { data: subscriptions, error: subError } = await supabase
        .from('subscriptions')
        .select('*, tenants!inner(id, name, status)')
        .eq('status', 'active');

      if (subError) throw subError;

      // Get plan configs for pricing
      const { data: planConfigs } = await supabase
        .from('plan_configs')
        .select('plan, monthly_price, name');

      const planPriceMap = new Map(
        planConfigs?.map(p => [p.plan, { price: Number(p.monthly_price), name: p.name }]) || []
      );

      // Calculate stats
      const validSubscriptions = subscriptions?.filter(s => 
        new Date(s.end_date) > new Date() && 
        (s.tenants as any)?.status === 'active'
      ) || [];

      const totalActiveTenants = validSubscriptions.length;
      const totalPayingTenants = validSubscriptions.filter(s => 
        s.plan !== 'starter' || planPriceMap.get(s.plan)?.price > 0
      ).length;

      // Calculate MRR
      let mrr = 0;
      const planCounts: Record<string, { count: number; revenue: number; name: string }> = {};

      validSubscriptions.forEach(sub => {
        const planInfo = planPriceMap.get(sub.plan);
        const price = planInfo?.price || 0;
        mrr += price;

        if (!planCounts[sub.plan]) {
          planCounts[sub.plan] = { count: 0, revenue: 0, name: planInfo?.name || sub.plan };
        }
        planCounts[sub.plan].count++;
        planCounts[sub.plan].revenue += price;
      });

      const planDistribution = Object.entries(planCounts).map(([plan, data]) => ({
        plan: data.name,
        count: data.count,
        revenue: data.revenue
      }));

      // Get recent subscriptions (last 30 days)
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      const { data: recentSubs } = await supabase
        .from('subscriptions')
        .select('*, tenants(name)')
        .gte('created_at', thirtyDaysAgo)
        .order('created_at', { ascending: false })
        .limit(10);

      // Get addon revenue
      const { data: addonPurchases } = await supabase
        .from('tenant_addons')
        .select('quantity_purchased, addon_configs(price)')
        .eq('is_active', true);

      const addonRevenue = addonPurchases?.reduce((sum, p) => 
        sum + (Number((p.addon_configs as any)?.price || 0) * p.quantity_purchased), 0
      ) || 0;

      return {
        totalActiveTenants,
        totalPayingTenants,
        monthlyRecurringRevenue: mrr,
        planDistribution,
        recentSubscriptions: recentSubs || [],
        addonRevenue
      };
    },
    staleTime: 60000
  });

  const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonLoader variant="card" count={4} />
        <SkeletonLoader variant="chart" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground lg:text-3xl">
          Revenue Dashboard
        </h1>
        <p className="mt-1 text-muted-foreground">
          Financial overview and subscription metrics
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Monthly Recurring Revenue"
          value={`৳${stats?.monthlyRecurringRevenue.toLocaleString()}`}
          icon={<DollarSign className="h-5 w-5 text-success" />}
          variant="success"
        />
        <StatCard
          title="Active Tenants"
          value={stats?.totalActiveTenants || 0}
          icon={<Building2 className="h-5 w-5 text-primary" />}
        />
        <StatCard
          title="Paying Tenants"
          value={stats?.totalPayingTenants || 0}
          subtitle={`${Math.round(((stats?.totalPayingTenants || 0) / (stats?.totalActiveTenants || 1)) * 100)}% conversion`}
          icon={<CreditCard className="h-5 w-5 text-info" />}
        />
        <StatCard
          title="Add-On Revenue"
          value={`৳${stats?.addonRevenue.toLocaleString()}`}
          icon={<TrendingUp className="h-5 w-5 text-warning" />}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Plan Distribution */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Plan Distribution
            </CardTitle>
            <CardDescription>
              Active subscriptions by plan type
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.planDistribution && stats.planDistribution.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ReChartPie>
                    <Pie
                      data={stats.planDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="count"
                      nameKey="plan"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {stats.planDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name, props) => [
                        `${value} tenants (৳${props.payload.revenue.toLocaleString()}/mo)`,
                        props.payload.plan
                      ]}
                    />
                    <Legend />
                  </ReChartPie>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No subscription data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Plan Revenue Breakdown */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Revenue by Plan
            </CardTitle>
            <CardDescription>
              Monthly revenue contribution per plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.planDistribution?.map((plan, index) => (
                <div key={plan.plan} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-3 w-3 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="font-medium">{plan.plan}</span>
                      <Badge variant="outline" className="text-xs">
                        {plan.count} tenants
                      </Badge>
                    </div>
                    <span className="font-bold text-primary">
                      ৳{plan.revenue.toLocaleString()}/mo
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all"
                      style={{ 
                        width: `${(plan.revenue / (stats.monthlyRecurringRevenue || 1)) * 100}%`,
                        backgroundColor: COLORS[index % COLORS.length]
                      }}
                    />
                  </div>
                </div>
              ))}

              {stats?.planDistribution?.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No revenue data yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Subscriptions */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Subscriptions
          </CardTitle>
          <CardDescription>
            Latest subscription activity in the last 30 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats?.recentSubscriptions && stats.recentSubscriptions.length > 0 ? (
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {stats.recentSubscriptions.map((sub) => (
                  <div 
                    key={sub.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      </div>
                      <div>
                        <p className="font-medium">{(sub.tenants as any)?.name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(sub.created_at), 'dd MMM yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">{sub.plan}</Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        Until {format(new Date(sub.end_date), 'dd MMM yyyy')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              No recent subscription activity
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
