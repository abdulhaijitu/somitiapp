import { useLanguage } from '@/contexts/LanguageContext';
import { StatCard } from '@/components/ui/stat-card';
import { 
  Users, 
  CreditCard, 
  TrendingUp, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OnboardingChecklist } from '@/components/onboarding/OnboardingChecklist';

// Mock data for the dashboard
const recentPayments = [
  { id: 1, member: 'আব্দুল করিম', amount: 1000, date: '2024-01-15', status: 'paid' },
  { id: 2, member: 'ফাতেমা বেগম', amount: 1000, date: '2024-01-14', status: 'paid' },
  { id: 3, member: 'মোহাম্মদ আলী', amount: 500, date: '2024-01-13', status: 'partial' },
  { id: 4, member: 'নূরজাহান খাতুন', amount: 1000, date: '2024-01-12', status: 'paid' },
  { id: 5, member: 'রহিম উদ্দিন', amount: 0, date: '2024-01-11', status: 'pending' },
];

const recentActivity = [
  { id: 1, action: 'New member added', name: 'সালমা আক্তার', time: '2 hours ago' },
  { id: 2, action: 'Payment received', name: 'আব্দুল করিম', time: '4 hours ago' },
  { id: 3, action: 'Notice published', name: 'Annual Meeting', time: '1 day ago' },
  { id: 4, action: 'Member updated', name: 'মোহাম্মদ আলী', time: '2 days ago' },
];

export function DashboardOverview() {
  const { t } = useLanguage();

  const stats = [
    {
      title: t('dashboard.totalMembers'),
      value: '156',
      subtitle: '+12 this month',
      icon: <Users className="h-5 w-5 text-primary" />,
      trend: { value: 8.2, isPositive: true },
    },
    {
      title: t('dashboard.totalCollection'),
      value: `৳ 4,52,000`,
      subtitle: 'This year',
      icon: <CreditCard className="h-5 w-5 text-primary" />,
      trend: { value: 12.5, isPositive: true },
    },
    {
      title: t('dashboard.monthlyPayments'),
      value: `৳ 1,45,000`,
      subtitle: 'January 2024',
      icon: <TrendingUp className="h-5 w-5 text-primary" />,
      trend: { value: 3.1, isPositive: true },
    },
    {
      title: t('dashboard.outstandingDues'),
      value: `৳ 23,500`,
      subtitle: '15 members',
      icon: <AlertCircle className="h-5 w-5 text-warning" />,
      trend: { value: 5.3, isPositive: false },
      variant: 'warning' as const,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Onboarding Checklist - shows for new tenants */}
      <OnboardingChecklist />

      {/* Page title */}
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
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            subtitle={stat.subtitle}
            icon={stat.icon}
            trend={stat.trend}
            variant={stat.variant || 'glass'}
            className="animate-slide-up"
            style={{ animationDelay: `${index * 50}ms` }}
          />
        ))}
      </div>

      {/* Content grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Payments */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">
              Recent Payments
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-primary">
              {t('common.viewAll')}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary font-bengali">
                      {payment.member.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-foreground font-bengali">
                        {payment.member}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {payment.date}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">
                      ৳ {payment.amount.toLocaleString()}
                    </p>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        payment.status === 'paid'
                          ? 'bg-success/10 text-success'
                          : payment.status === 'partial'
                          ? 'bg-warning/10 text-warning'
                          : 'bg-destructive/10 text-destructive'
                      }`}
                    >
                      {payment.status === 'paid' ? 'Paid' : payment.status === 'partial' ? 'Partial' : 'Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">
              {t('dashboard.recentActivity')}
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-primary">
              {t('common.viewAll')}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex gap-3">
                  <div className="relative flex flex-col items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <ArrowUpRight className="h-4 w-4 text-primary" />
                    </div>
                    {activity.id !== recentActivity.length && (
                      <div className="my-1 h-full w-px bg-border" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="text-sm font-medium text-foreground">
                      {activity.action}
                    </p>
                    <p className="text-sm text-muted-foreground font-bengali">
                      {activity.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Trends Chart Placeholder */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            {t('dashboard.paymentTrends')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30">
            <div className="text-center">
              <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                Payment trends chart will be displayed here
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
