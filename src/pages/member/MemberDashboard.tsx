import { useLanguage } from '@/contexts/LanguageContext';
import { useTenant } from '@/contexts/TenantContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Wallet, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  CreditCard,
  ArrowRight,
  Calendar
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export function MemberDashboard() {
  const { language } = useLanguage();
  const { tenant, userId } = useTenant();

  // Fetch member data
  const { data: memberData, isLoading: memberLoading } = useQuery({
    queryKey: ['member-profile', userId, tenant?.id],
    queryFn: async () => {
      if (!userId || !tenant?.id) return null;
      
      // Get member linked to this user (via phone or email match)
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return null;

      const { data: member, error } = await supabase
        .from('members')
        .select('*')
        .eq('tenant_id', tenant.id)
        .or(`email.eq.${user.user.email},phone.eq.${user.user.phone}`)
        .maybeSingle();

      if (error) throw error;
      return member;
    },
    enabled: !!userId && !!tenant?.id
  });

  // Fetch payment summary
  const { data: paymentSummary, isLoading: paymentsLoading } = useQuery({
    queryKey: ['member-payment-summary', memberData?.id],
    queryFn: async () => {
      if (!memberData?.id) return null;

      const { data: payments, error } = await supabase
        .from('payments')
        .select('amount, status, payment_date, created_at')
        .eq('member_id', memberData.id)
        .eq('tenant_id', tenant!.id);

      if (error) throw error;

      const paidPayments = payments?.filter(p => p.status === 'paid') || [];
      const pendingPayments = payments?.filter(p => p.status === 'pending') || [];
      
      const totalPaid = paidPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      const totalPending = pendingPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      
      // Get last payment date
      const sortedPaid = paidPayments
        .filter(p => p.payment_date)
        .sort((a, b) => new Date(b.payment_date!).getTime() - new Date(a.payment_date!).getTime());
      
      const lastPaymentDate = sortedPaid[0]?.payment_date;

      return {
        totalPaid,
        totalPending,
        paidCount: paidPayments.length,
        pendingCount: pendingPayments.length,
        lastPaymentDate
      };
    },
    enabled: !!memberData?.id
  });

  const isLoading = memberLoading || paymentsLoading;

  const memberName = memberData 
    ? (language === 'bn' && memberData.name_bn ? memberData.name_bn : memberData.name)
    : '';

  const greeting = language === 'bn' 
    ? `স্বাগতম, ${memberName}!` 
    : `Welcome back, ${memberName}!`;

  const formatCurrency = (amount: number) => {
    return language === 'bn' 
      ? `৳${amount.toLocaleString('bn-BD')}` 
      : `৳${amount.toLocaleString()}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="space-y-1">
        {isLoading ? (
          <>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-5 w-48" />
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-foreground lg:text-3xl font-bengali">
              {greeting}
            </h1>
            <p className="text-muted-foreground">
              {language === 'bn' 
                ? 'আপনার সমিতির সারসংক্ষেপ দেখুন' 
                : 'View your somiti summary at a glance'}
            </p>
          </>
        )}
      </div>

      {/* Summary Cards - Mobile First Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Total Paid */}
        <Card className="stat-card">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {language === 'bn' ? 'মোট পরিশোধিত' : 'Total Paid'}
                </p>
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(paymentSummary?.totalPaid || 0)}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {isLoading ? (
                    <Skeleton className="h-4 w-20" />
                  ) : (
                    `${paymentSummary?.paidCount || 0} ${language === 'bn' ? 'টি পেমেন্ট' : 'payments'}`
                  )}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Outstanding Dues */}
        <Card className={`stat-card ${(paymentSummary?.totalPending || 0) > 0 ? 'border-warning/50' : ''}`}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {language === 'bn' ? 'বকেয়া বাকি' : 'Outstanding Dues'}
                </p>
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <p className={`text-2xl font-bold ${(paymentSummary?.totalPending || 0) > 0 ? 'text-warning' : 'text-foreground'}`}>
                    {formatCurrency(paymentSummary?.totalPending || 0)}
                  </p>
                )}
                {!isLoading && (paymentSummary?.pendingCount || 0) > 0 && (
                  <p className="text-xs text-warning">
                    {paymentSummary?.pendingCount} {language === 'bn' ? 'টি বকেয়া' : 'pending'}
                  </p>
                )}
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                (paymentSummary?.totalPending || 0) > 0 ? 'bg-warning/10' : 'bg-muted'
              }`}>
                {(paymentSummary?.totalPending || 0) > 0 
                  ? <AlertCircle className="h-6 w-6 text-warning" />
                  : <Wallet className="h-6 w-6 text-muted-foreground" />
                }
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Last Payment */}
        <Card className="stat-card sm:col-span-2 lg:col-span-1">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {language === 'bn' ? 'সর্বশেষ পেমেন্ট' : 'Last Payment'}
                </p>
                {isLoading ? (
                  <Skeleton className="h-8 w-32" />
                ) : paymentSummary?.lastPaymentDate ? (
                  <p className="text-2xl font-bold text-foreground">
                    {format(new Date(paymentSummary.lastPaymentDate), 'd MMM yyyy')}
                  </p>
                ) : (
                  <p className="text-lg text-muted-foreground">
                    {language === 'bn' ? 'কোনো পেমেন্ট নেই' : 'No payments yet'}
                  </p>
                )}
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bengali">
            {language === 'bn' ? 'দ্রুত অ্যাক্সেস' : 'Quick Access'}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Link to="/member/payments">
            <Button 
              variant="outline" 
              className="w-full justify-between h-auto py-4 px-4"
            >
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-primary" />
                <span className="font-bengali">
                  {language === 'bn' ? 'পেমেন্ট ইতিহাস দেখুন' : 'View Payment History'}
                </span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Button>
          </Link>
          
          <Link to="/member/dues">
            <Button 
              variant="outline" 
              className="w-full justify-between h-auto py-4 px-4"
            >
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-warning" />
                <span className="font-bengali">
                  {language === 'bn' ? 'বকেয়া বিবরণ দেখুন' : 'View Dues Details'}
                </span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Member Info Card */}
      {memberData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bengali">
              {language === 'bn' ? 'আমার তথ্য' : 'My Information'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  {language === 'bn' ? 'সদস্য নম্বর' : 'Member Number'}
                </p>
                <p className="font-medium">{memberData.member_number || '-'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  {language === 'bn' ? 'মোবাইল' : 'Mobile'}
                </p>
                <p className="font-medium">{memberData.phone || '-'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  {language === 'bn' ? 'ইমেইল' : 'Email'}
                </p>
                <p className="font-medium">{memberData.email || '-'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  {language === 'bn' ? 'যোগদানের তারিখ' : 'Member Since'}
                </p>
                <p className="font-medium">
                  {memberData.joined_at 
                    ? format(new Date(memberData.joined_at), 'd MMM yyyy')
                    : '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
