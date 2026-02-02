import { useLanguage } from '@/contexts/LanguageContext';
import { useTenant } from '@/contexts/TenantContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  Wallet,
  Info
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, differenceInDays, startOfMonth } from 'date-fns';

export function MemberDuesPage() {
  const { language } = useLanguage();
  const { tenant, userId } = useTenant();

  // Fetch member data
  const { data: memberData } = useQuery({
    queryKey: ['member-profile', userId, tenant?.id],
    queryFn: async () => {
      if (!userId || !tenant?.id) return null;
      
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

  // Fetch pending payments
  const { data: duesData, isLoading } = useQuery({
    queryKey: ['member-dues', memberData?.id],
    queryFn: async () => {
      if (!memberData?.id) return null;

      const { data: pendingPayments, error } = await supabase
        .from('payments')
        .select('*')
        .eq('member_id', memberData.id)
        .eq('tenant_id', tenant!.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;

      const totalDue = (pendingPayments || []).reduce((sum, p) => sum + Number(p.amount), 0);
      
      // Calculate if any are overdue (older than 30 days)
      const now = new Date();
      const overdueDues = (pendingPayments || []).filter(p => {
        const createdAt = new Date(p.created_at);
        return differenceInDays(now, createdAt) > 30;
      });

      return {
        pendingPayments: pendingPayments || [],
        totalDue,
        overdueCount: overdueDues.length,
        overdueAmount: overdueDues.reduce((sum, p) => sum + Number(p.amount), 0),
        monthlyAmount: memberData?.monthly_amount || 1000
      };
    },
    enabled: !!memberData?.id
  });

  const formatCurrency = (amount: number) => {
    return language === 'bn' 
      ? `৳${amount.toLocaleString('bn-BD')}` 
      : `৳${amount.toLocaleString()}`;
  };

  const formatPeriod = (month: number | null, year: number | null) => {
    if (!month || !year) return language === 'bn' ? 'অজানা সময়কাল' : 'Unknown period';
    const monthNames = language === 'bn' 
      ? ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর']
      : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${monthNames[month - 1]} ${year}`;
  };

  const hasNoDues = !duesData || duesData.totalDue === 0;
  const hasOverdue = duesData && duesData.overdueCount > 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground lg:text-3xl font-bengali">
          {language === 'bn' ? 'আমার বকেয়া' : 'My Dues'}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {language === 'bn' 
            ? 'আপনার বকেয়া পেমেন্টের বিবরণ' 
            : 'Details of your outstanding payments'}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : hasNoDues ? (
        /* All Clear State */
        <Card className="border-success/30 bg-success/5">
          <CardContent className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2 font-bengali">
              {language === 'bn' ? 'কোনো বকেয়া নেই!' : 'All Clear!'}
            </h2>
            <p className="text-muted-foreground max-w-sm mx-auto">
              {language === 'bn' 
                ? 'আপনার কোনো বকেয়া পেমেন্ট নেই। ধন্যবাদ আপনার নিয়মিত পেমেন্টের জন্য।' 
                : 'You have no outstanding dues. Thank you for staying on top of your payments!'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Overdue Warning */}
          {hasOverdue && (
            <Alert variant="destructive" className="border-destructive/50 bg-destructive/5">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="font-bengali">
                {language === 'bn' ? 'বিলম্বিত পেমেন্ট' : 'Overdue Payment'}
              </AlertTitle>
              <AlertDescription>
                {language === 'bn' 
                  ? `আপনার ${duesData.overdueCount} টি পেমেন্ট বিলম্বিত হয়েছে। অনুগ্রহ করে যত তাড়াতাড়ি সম্ভব পরিশোধ করুন।` 
                  : `You have ${duesData.overdueCount} overdue payment(s). Please clear them at your earliest convenience.`}
              </AlertDescription>
            </Alert>
          )}

          {/* Summary Card */}
          <Card className={hasOverdue ? 'border-warning/50' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-bengali">
                <Wallet className="h-5 w-5" />
                {language === 'bn' ? 'বকেয়ার সারসংক্ষেপ' : 'Dues Summary'}
              </CardTitle>
              <CardDescription>
                {language === 'bn' 
                  ? 'আপনার মাসিক চাঁদার হার:' 
                  : 'Your monthly contribution rate:'} {formatCurrency(duesData.monthlyAmount)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-border p-4 space-y-1">
                  <p className="text-sm text-muted-foreground">
                    {language === 'bn' ? 'মোট বকেয়া' : 'Total Due'}
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {formatCurrency(duesData.totalDue)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {duesData.pendingPayments.length} {language === 'bn' ? 'টি পেমেন্ট বাকি' : 'pending payments'}
                  </p>
                </div>
                
                {hasOverdue && (
                  <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-1">
                    <p className="text-sm text-destructive">
                      {language === 'bn' ? 'বিলম্বিত পরিমাণ' : 'Overdue Amount'}
                    </p>
                    <p className="text-3xl font-bold text-destructive">
                      {formatCurrency(duesData.overdueAmount)}
                    </p>
                    <p className="text-xs text-destructive/80">
                      {duesData.overdueCount} {language === 'bn' ? 'টি বিলম্বিত' : 'overdue'}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pending Payments List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-bengali">
                <Clock className="h-5 w-5" />
                {language === 'bn' ? 'বাকি পেমেন্টের তালিকা' : 'Pending Payments'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {duesData.pendingPayments.map((payment) => {
                  const createdAt = new Date(payment.created_at);
                  const daysOld = differenceInDays(new Date(), createdAt);
                  const isOverdue = daysOld > 30;
                  
                  return (
                    <div 
                      key={payment.id}
                      className={`flex items-center justify-between p-4 rounded-xl border ${
                        isOverdue ? 'border-destructive/30 bg-destructive/5' : 'border-border'
                      }`}
                    >
                      <div className="space-y-1">
                        <p className="font-medium text-foreground font-bengali">
                          {formatPeriod(payment.period_month, payment.period_year)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {language === 'bn' ? 'তৈরি:' : 'Created:'} {format(createdAt, 'd MMM yyyy')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${isOverdue ? 'text-destructive' : 'text-foreground'}`}>
                          {formatCurrency(payment.amount)}
                        </p>
                        {isOverdue && (
                          <p className="text-xs text-destructive">
                            {daysOld} {language === 'bn' ? 'দিন বিলম্বিত' : 'days overdue'}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Info Note */}
          <Alert className="border-info/30 bg-info/5">
            <Info className="h-4 w-4 text-info" />
            <AlertDescription className="text-info font-bengali">
              {language === 'bn' 
                ? 'পেমেন্ট করতে আপনার সমিতির ম্যানেজারের সাথে যোগাযোগ করুন অথবা অনলাইন পেমেন্ট অপশন ব্যবহার করুন।' 
                : 'To make a payment, please contact your somiti manager or use the online payment option if available.'}
            </AlertDescription>
          </Alert>
        </>
      )}
    </div>
  );
}
