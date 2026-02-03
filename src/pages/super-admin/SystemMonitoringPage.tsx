import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatCard } from '@/components/ui/stat-card';
import { SkeletonLoader } from '@/components/ui/skeleton-loader';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MessageSquare,
  CreditCard,
  Shield,
  RefreshCw,
  Clock,
  Activity,
  AlertCircle,
  Zap
} from 'lucide-react';
import { format, formatDistanceToNow, subDays } from 'date-fns';
import { useQuery } from '@tanstack/react-query';

interface MonitoringStats {
  authFailures24h: number;
  paymentFailures24h: number;
  smsFailures24h: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
}

interface FailureLog {
  id: string;
  type: 'auth' | 'payment' | 'sms';
  message: string;
  tenant_name?: string;
  created_at: string;
  severity: 'warning' | 'error' | 'critical';
  details?: Record<string, unknown>;
}

export function SystemMonitoringPage() {
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Fetch monitoring stats
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['monitoring-stats'],
    queryFn: async () => {
      const since24h = subDays(new Date(), 1).toISOString();
      
      // Get auth failures from audit logs
      const { count: authFailures } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .eq('action', 'AUTH_LOGIN_FAILED')
        .gte('created_at', since24h);

      // Get payment failures
      const { count: paymentFailures } = await supabase
        .from('payment_logs')
        .select('*', { count: 'exact', head: true })
        .eq('new_status', 'failed')
        .gte('created_at', since24h);

      // Get SMS failures
      const { count: smsFailures } = await supabase
        .from('sms_logs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'failed')
        .gte('created_at', since24h);

      // Get subscription stats
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('status, end_date');

      const now = new Date();
      const activeCount = subscriptions?.filter(s => 
        s.status === 'active' && new Date(s.end_date) > now
      ).length || 0;
      const expiredCount = subscriptions?.filter(s => 
        s.status === 'active' && new Date(s.end_date) <= now
      ).length || 0;

      return {
        authFailures24h: authFailures || 0,
        paymentFailures24h: paymentFailures || 0,
        smsFailures24h: smsFailures || 0,
        activeSubscriptions: activeCount,
        expiredSubscriptions: expiredCount
      } as MonitoringStats;
    }
  });

  // Fetch recent failures
  const { data: recentFailures, isLoading: failuresLoading, refetch: refetchFailures } = useQuery({
    queryKey: ['recent-failures'],
    queryFn: async () => {
      const since24h = subDays(new Date(), 1).toISOString();
      const failures: FailureLog[] = [];

      // Auth failures
      const { data: authLogs } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('action', 'AUTH_LOGIN_FAILED')
        .gte('created_at', since24h)
        .order('created_at', { ascending: false })
        .limit(20);

      authLogs?.forEach(log => {
        failures.push({
          id: log.id,
          type: 'auth',
          message: `Login failed: ${(log.details as Record<string, unknown>)?.email || 'Unknown user'}`,
          created_at: log.created_at,
          severity: 'warning',
          details: log.details as Record<string, unknown>
        });
      });

      // Payment failures
      const { data: paymentLogs } = await supabase
        .from('payment_logs')
        .select('*, payments(tenant_id)')
        .eq('new_status', 'failed')
        .gte('created_at', since24h)
        .order('created_at', { ascending: false })
        .limit(20);

      paymentLogs?.forEach(log => {
        failures.push({
          id: log.id,
          type: 'payment',
          message: `Payment failed: ${log.action}`,
          created_at: log.created_at,
          severity: 'error',
          details: log.details as Record<string, unknown>
        });
      });

      // SMS failures
      const { data: smsLogs } = await supabase
        .from('sms_logs')
        .select('*, tenants:tenant_id(name)')
        .eq('status', 'failed')
        .gte('created_at', since24h)
        .order('created_at', { ascending: false })
        .limit(20);

      smsLogs?.forEach(log => {
        const tenants = log.tenants as { name: string } | null;
        failures.push({
          id: log.id,
          type: 'sms',
          message: `SMS failed to ${log.phone_number}: ${log.error_message || 'Unknown error'}`,
          tenant_name: tenants?.name,
          created_at: log.created_at,
          severity: 'warning',
          details: { provider: log.provider, notification_type: log.notification_type }
        });
      });

      // Sort by date
      return failures.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
  });

  const handleRefresh = () => {
    refetchStats();
    refetchFailures();
    setLastRefresh(new Date());
  };

  const getSystemStatus = () => {
    if (!stats) return 'unknown';
    const totalFailures = stats.authFailures24h + stats.paymentFailures24h + stats.smsFailures24h;
    if (totalFailures === 0) return 'healthy';
    if (totalFailures < 10) return 'warning';
    return 'critical';
  };

  const systemStatus = getSystemStatus();

  if (statsLoading) {
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground lg:text-3xl">
            System Monitoring
          </h1>
          <p className="mt-1 text-muted-foreground">
            Real-time monitoring of auth, payments, and SMS services
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground">
            Last updated: {format(lastRefresh, 'HH:mm:ss')}
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Status Banner */}
      <Card className={
        systemStatus === 'healthy' ? 'border-success/30 bg-success/5' :
        systemStatus === 'warning' ? 'border-warning/30 bg-warning/5' :
        'border-destructive/30 bg-destructive/5'
      }>
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
              systemStatus === 'healthy' ? 'bg-success/20' :
              systemStatus === 'warning' ? 'bg-warning/20' :
              'bg-destructive/20'
            }`}>
              {systemStatus === 'healthy' ? (
                <CheckCircle2 className="h-6 w-6 text-success" />
              ) : systemStatus === 'warning' ? (
                <AlertTriangle className="h-6 w-6 text-warning" />
              ) : (
                <XCircle className="h-6 w-6 text-destructive" />
              )}
            </div>
            <div>
              <h3 className={`font-semibold ${
                systemStatus === 'healthy' ? 'text-success' :
                systemStatus === 'warning' ? 'text-warning' :
                'text-destructive'
              }`}>
                {systemStatus === 'healthy' ? 'All Systems Operational' :
                 systemStatus === 'warning' ? 'Minor Issues Detected' :
                 'Critical Issues Detected'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {stats && (
                  <>
                    {stats.authFailures24h + stats.paymentFailures24h + stats.smsFailures24h} failures in the last 24 hours
                  </>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Auth Failures"
          subtitle="Last 24h"
          value={stats?.authFailures24h || 0}
          icon={<Shield className="h-5 w-5 text-warning" />}
          variant={stats?.authFailures24h ? 'warning' : 'success'}
        />
        <StatCard
          title="Payment Failures"
          subtitle="Last 24h"
          value={stats?.paymentFailures24h || 0}
          icon={<CreditCard className="h-5 w-5 text-destructive" />}
          variant={stats?.paymentFailures24h ? 'default' : 'success'}
        />
        <StatCard
          title="SMS Failures"
          subtitle="Last 24h"
          value={stats?.smsFailures24h || 0}
          icon={<MessageSquare className="h-5 w-5 text-warning" />}
          variant={stats?.smsFailures24h ? 'warning' : 'success'}
        />
        <StatCard
          title="Active Subscriptions"
          value={stats?.activeSubscriptions || 0}
          icon={<CheckCircle2 className="h-5 w-5 text-success" />}
          variant="success"
        />
        <StatCard
          title="Expired Subscriptions"
          value={stats?.expiredSubscriptions || 0}
          icon={<Clock className="h-5 w-5 text-destructive" />}
          variant={stats?.expiredSubscriptions ? 'default' : 'success'}
        />
      </div>

      {/* Recent Failures */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Failures (24h)
          </CardTitle>
          <CardDescription>
            Real-time log of authentication, payment, and SMS failures
          </CardDescription>
        </CardHeader>
        <CardContent>
          {failuresLoading ? (
            <SkeletonLoader variant="card" count={5} />
          ) : recentFailures && recentFailures.length > 0 ? (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {recentFailures.map((failure) => (
                  <div
                    key={failure.id}
                    className="flex items-start gap-3 rounded-lg border border-border p-3"
                  >
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0 ${
                      failure.type === 'auth' ? 'bg-warning/10' :
                      failure.type === 'payment' ? 'bg-destructive/10' :
                      'bg-info/10'
                    }`}>
                      {failure.type === 'auth' ? (
                        <Shield className="h-4 w-4 text-warning" />
                      ) : failure.type === 'payment' ? (
                        <CreditCard className="h-4 w-4 text-destructive" />
                      ) : (
                        <MessageSquare className="h-4 w-4 text-info" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-foreground">
                          {failure.message}
                        </p>
                        <Badge variant="outline" className="text-xs flex-shrink-0">
                          {failure.type.toUpperCase()}
                        </Badge>
                      </div>
                      {failure.tenant_name && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Tenant: {failure.tenant_name}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(failure.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10 mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <p className="font-medium text-foreground">No Failures</p>
              <p className="text-sm text-muted-foreground mt-1">
                All systems running smoothly in the last 24 hours
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Emergency Controls
          </CardTitle>
          <CardDescription>
            Quick actions for emergency situations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Disable SMS Temporarily
            </Button>
            <Button variant="outline" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Pause Online Payments
            </Button>
            <Button variant="outline" className="gap-2 text-warning border-warning/50 hover:bg-warning/10">
              <AlertTriangle className="h-4 w-4" />
              Enable Maintenance Mode
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            ⚠️ These actions affect all tenants. Use with caution.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
