import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SkeletonLoader } from '@/components/ui/skeleton-loader';
import { 
  Building2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle,
  ArrowRight,
  CreditCard,
  TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, differenceInDays } from 'date-fns';

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  status: string;
  created_at: string;
  subscriptions: {
    id: string;
    plan: string;
    status: string;
    end_date: string;
  } | null;
}

interface DashboardStats {
  totalTenants: number;
  activeTenants: number;
  suspendedTenants: number;
  expiringSubscriptions: number;
}

export function SuperAdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalTenants: 0,
    activeTenants: 0,
    suspendedTenants: 0,
    expiringSubscriptions: 0
  });
  const [recentTenants, setRecentTenants] = useState<Tenant[]>([]);
  const [expiringTenants, setExpiringTenants] = useState<Tenant[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get all tenants with subscriptions
      const { data: tenants, error } = await supabase
        .from('tenants')
        .select('*, subscriptions(*)')
        .neq('status', 'deleted')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading tenants:', error);
        return;
      }

      const tenantsData = tenants || [];
      
      // Calculate stats
      const activeTenants = tenantsData.filter(t => t.status === 'active').length;
      const suspendedTenants = tenantsData.filter(t => t.status === 'suspended').length;
      
      // Find expiring subscriptions (within 7 days)
      const now = new Date();
      const expiringList = tenantsData.filter(t => {
        if (!t.subscriptions) return false;
        const endDate = new Date(t.subscriptions.end_date);
        const daysUntilExpiry = differenceInDays(endDate, now);
        return daysUntilExpiry >= 0 && daysUntilExpiry <= 7;
      });

      setStats({
        totalTenants: tenantsData.length,
        activeTenants,
        suspendedTenants,
        expiringSubscriptions: expiringList.length
      });

      setRecentTenants(tenantsData.slice(0, 5));
      setExpiringTenants(expiringList.slice(0, 5));
      
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-success/10 text-success hover:bg-success/20">Active</Badge>;
      case 'suspended':
        return <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/20">Suspended</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDaysRemaining = (endDate: string) => {
    const days = differenceInDays(new Date(endDate), new Date());
    if (days < 0) return 'Expired';
    if (days === 0) return 'Today';
    if (days === 1) return '1 day';
    return `${days} days`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SkeletonLoader variant="card" count={4} />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <SkeletonLoader variant="chart" />
          <SkeletonLoader variant="chart" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-foreground lg:text-3xl">
          Super Admin Dashboard
        </h1>
        <p className="mt-1 text-muted-foreground">
          Overview of all tenants and system status
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Tenants"
          value={stats.totalTenants}
          icon={<Building2 className="h-5 w-5 text-primary" />}
          variant="glass"
        />
        <StatCard
          title="Active Tenants"
          value={stats.activeTenants}
          icon={<CheckCircle2 className="h-5 w-5 text-success" />}
          variant="success"
        />
        <StatCard
          title="Suspended Tenants"
          value={stats.suspendedTenants}
          icon={<XCircle className="h-5 w-5 text-destructive" />}
          variant="default"
        />
        <StatCard
          title="Expiring Soon"
          value={stats.expiringSubscriptions}
          subtitle="Within 7 days"
          icon={<AlertTriangle className="h-5 w-5 text-warning" />}
          variant="warning"
        />
      </div>

      {/* Content grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Tenants */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">
              Recently Created Tenants
            </CardTitle>
            <Link to="/super-admin/tenants">
              <Button variant="ghost" size="sm" className="text-primary gap-1">
                View All
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentTenants.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-2">No tenants created yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTenants.map((tenant) => (
                  <div
                    key={tenant.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
                        {tenant.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{tenant.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {tenant.subdomain}.somiti.app
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(tenant.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expiring Subscriptions */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">
              Upcoming Subscription Expiries
            </CardTitle>
            <Link to="/super-admin/subscriptions">
              <Button variant="ghost" size="sm" className="text-primary gap-1">
                View All
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {expiringTenants.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <CheckCircle2 className="mx-auto h-12 w-12 text-success/50" />
                <p className="mt-2">No subscriptions expiring soon</p>
              </div>
            ) : (
              <div className="space-y-3">
                {expiringTenants.map((tenant) => (
                  <div
                    key={tenant.id}
                    className="flex items-center justify-between rounded-lg border border-warning/30 bg-warning/5 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                        <Clock className="h-5 w-5 text-warning" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{tenant.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {tenant.subscriptions?.plan || 'Standard'} Plan
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-warning">
                        {getDaysRemaining(tenant.subscriptions?.end_date || '')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {tenant.subscriptions?.end_date 
                          ? format(new Date(tenant.subscriptions.end_date), 'MMM d, yyyy')
                          : '-'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Link to="/super-admin/tenants?action=create">
              <Button className="gap-2 bg-gradient-primary hover:opacity-90">
                <Building2 className="h-4 w-4" />
                Create New Tenant
              </Button>
            </Link>
            <Link to="/super-admin/subscriptions">
              <Button variant="outline" className="gap-2">
                <CreditCard className="h-4 w-4" />
                Manage Subscriptions
              </Button>
            </Link>
            <Link to="/super-admin/audit-logs">
              <Button variant="outline" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                View Audit Logs
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
