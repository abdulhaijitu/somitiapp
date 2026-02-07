import { useLanguage } from '@/contexts/LanguageContext';
import { StatCard } from '@/components/ui/stat-card';
import { 
  Users, 
  CreditCard, 
  TrendingUp, 
  AlertCircle,
  ArrowUpRight,
  UserPlus,
  Bell,
  Receipt,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OnboardingChecklist } from '@/components/onboarding/OnboardingChecklist';
import { PendingPaymentRequests } from '@/components/payments/PendingPaymentRequests';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardStats } from '@/hooks/useDashboardStats';

function formatBDT(amount: number): string {
  return `৳ ${amount.toLocaleString('en-IN')}`;
}

export function DashboardOverview() {
  const { t } = useLanguage();
  const {
    stats,
    isLoadingStats,
    recentPayments,
    isLoadingPayments,
    recentActivity,
    isLoadingActivity,
  } = useDashboardStats();

  const now = new Date();
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const statCards = [
    {
      title: t('dashboard.totalMembers'),
      value: stats ? String(stats.totalMembers) : '—',
      subtitle: stats ? `+${stats.newMembersThisMonth} this month` : '',
      icon: <Users className="h-5 w-5 text-primary" />,
    },
    {
      title: t('dashboard.totalCollection'),
      value: stats ? formatBDT(stats.totalCollectionThisYear) : '—',
      subtitle: `${now.getFullYear()}`,
      icon: <CreditCard className="h-5 w-5 text-primary" />,
    },
    {
      title: t('dashboard.monthlyPayments'),
      value: stats ? formatBDT(stats.monthlyCollection) : '—',
      subtitle: `${monthNames[now.getMonth()]} ${now.getFullYear()}`,
      icon: <TrendingUp className="h-5 w-5 text-primary" />,
    },
    {
      title: t('dashboard.outstandingDues'),
      value: stats ? formatBDT(stats.outstandingDues) : '—',
      subtitle: stats ? `${stats.overdueMembers} members` : '',
      icon: <AlertCircle className="h-5 w-5 text-warning" />,
      variant: 'warning' as const,
    },
  ];

  const activityIcon = (type: string) => {
    switch (type) {
      case 'payment': return <Receipt className="h-4 w-4 text-primary" />;
      case 'member': return <UserPlus className="h-4 w-4 text-primary" />;
      case 'notice': return <Bell className="h-4 w-4 text-primary" />;
      default: return <ArrowUpRight className="h-4 w-4 text-primary" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <OnboardingChecklist />

      <div>
        <h1 className="text-2xl font-bold text-foreground lg:text-3xl">
          {t('dashboard.title')}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Overview of your somiti's performance
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoadingStats
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-lg" />
            ))
          : statCards.map((stat, index) => (
              <StatCard
                key={index}
                title={stat.title}
                value={stat.value}
                subtitle={stat.subtitle}
                icon={stat.icon}
                variant={stat.variant || 'glass'}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              />
            ))}
      </div>

      {/* Pending Payment Approval Queue */}
      <PendingPaymentRequests />

      {/* Content grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Payments */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Recent Payments</CardTitle>
            <Button variant="ghost" size="sm" className="text-primary">
              {t('common.viewAll')}
            </Button>
          </CardHeader>
          <CardContent>
            {isLoadingPayments ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-lg" />
                ))}
              </div>
            ) : recentPayments.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground text-sm">No payments yet</p>
            ) : (
              <div className="space-y-3">
                {recentPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary font-bengali">
                        {payment.memberName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-foreground font-bengali">
                          {payment.memberName}
                        </p>
                        <p className="text-xs text-muted-foreground">{payment.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">
                        {formatBDT(payment.amount)}
                      </p>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          payment.status === 'paid'
                            ? 'bg-success/10 text-success'
                            : payment.status === 'pending'
                            ? 'bg-warning/10 text-warning'
                            : 'bg-destructive/10 text-destructive'
                        }`}
                      >
                        {payment.status === 'paid' ? 'Paid' : payment.status === 'pending' ? 'Pending' : payment.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">
              {t('dashboard.recentActivity')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingActivity ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 rounded-lg" />
                ))}
              </div>
            ) : recentActivity.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground text-sm">No recent activity</p>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity, idx) => (
                  <div key={activity.id} className="flex gap-3">
                    <div className="relative flex flex-col items-center">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        {activityIcon(activity.type)}
                      </div>
                      {idx !== recentActivity.length - 1 && (
                        <div className="my-1 h-full w-px bg-border" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-sm font-medium text-foreground">{activity.action}</p>
                      <p className="text-sm text-muted-foreground font-bengali">{activity.name}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
