import { useLanguage } from '@/contexts/LanguageContext';
import { useTenant } from '@/contexts/TenantContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  Wallet,
  Info,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, isPast, startOfMonth, addMonths } from 'date-fns';
import { bn, enUS } from 'date-fns/locale';

interface DueWithContribution {
  id: string;
  amount: number;
  paid_amount: number;
  status: 'unpaid' | 'partial' | 'paid';
  due_month: string;
  contribution_type: {
    name: string;
    name_bn: string | null;
  } | null;
}

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

  // Fetch dues from the dues table
  const { data: duesData, isLoading } = useQuery({
    queryKey: ['member-dues-list', memberData?.id, tenant?.id],
    queryFn: async () => {
      if (!memberData?.id || !tenant?.id) return null;

      const { data: dues, error } = await supabase
        .from('dues')
        .select(`
          id,
          amount,
          paid_amount,
          status,
          due_month,
          contribution_type:contribution_types(name, name_bn)
        `)
        .eq('member_id', memberData.id)
        .eq('tenant_id', tenant.id)
        .order('due_month', { ascending: false });

      if (error) throw error;

      const duesList = (dues || []) as unknown as DueWithContribution[];
      
      // Calculate summary
      const unpaidDues = duesList.filter(d => d.status === 'unpaid');
      const partialDues = duesList.filter(d => d.status === 'partial');
      const paidDues = duesList.filter(d => d.status === 'paid');
      
      const totalDue = duesList.reduce((sum, d) => sum + (d.amount - d.paid_amount), 0);
      const totalPaid = duesList.reduce((sum, d) => sum + d.paid_amount, 0);
      
      // Check for overdue (unpaid dues from past months)
      const now = new Date();
      const currentMonth = format(now, 'yyyy-MM');
      const overdueDues = duesList.filter(d => 
        (d.status === 'unpaid' || d.status === 'partial') && d.due_month < currentMonth
      );

      return {
        dues: duesList,
        unpaidCount: unpaidDues.length,
        partialCount: partialDues.length,
        paidCount: paidDues.length,
        totalDue,
        totalPaid,
        overdueCount: overdueDues.length,
        overdueAmount: overdueDues.reduce((sum, d) => sum + (d.amount - d.paid_amount), 0),
        monthlyAmount: memberData?.monthly_amount || 0
      };
    },
    enabled: !!memberData?.id && !!tenant?.id
  });

  const formatCurrency = (amount: number) => {
    return language === 'bn' 
      ? `৳${amount.toLocaleString('bn-BD')}` 
      : `৳${amount.toLocaleString()}`;
  };

  const formatMonth = (monthStr: string) => {
    try {
      const date = parseISO(monthStr + '-01');
      return format(date, 'MMMM yyyy', { locale: language === 'bn' ? bn : enUS });
    } catch {
      return monthStr;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <Badge className="bg-success/10 text-success border-success/30">
            {language === 'bn' ? 'পরিশোধিত' : 'Paid'}
          </Badge>
        );
      case 'partial':
        return (
          <Badge className="bg-warning/10 text-warning border-warning/30">
            {language === 'bn' ? 'আংশিক' : 'Partial'}
          </Badge>
        );
      default:
        return (
          <Badge className="bg-destructive/10 text-destructive border-destructive/30">
            {language === 'bn' ? 'বাকি' : 'Unpaid'}
          </Badge>
        );
    }
  };

  const hasNoDues = !duesData || duesData.dues.length === 0;
  const hasOverdue = duesData && duesData.overdueCount > 0;
  const allPaid = duesData && duesData.totalDue === 0 && duesData.dues.length > 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground lg:text-3xl font-bengali">
          {language === 'bn' ? 'আমার বকেয়া' : 'My Dues'}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {language === 'bn' 
            ? 'আপনার মাসিক চাঁদা ও বকেয়ার বিবরণ' 
            : 'Your monthly contributions and outstanding dues'}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : hasNoDues ? (
        /* No Dues Generated Yet */
        <Card className="border-muted">
          <CardContent className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2 font-bengali">
              {language === 'bn' ? 'কোনো বকেয়া নেই' : 'No Dues Yet'}
            </h2>
            <p className="text-muted-foreground max-w-sm mx-auto">
              {language === 'bn' 
                ? 'আপনার জন্য এখনো কোনো মাসিক চাঁদা তৈরি হয়নি। শীঘ্রই তৈরি হলে এখানে দেখতে পাবেন।' 
                : 'No monthly dues have been generated for you yet. Check back later.'}
            </p>
          </CardContent>
        </Card>
      ) : allPaid ? (
        /* All Clear State */
        <Card className="border-success/30 bg-success/5">
          <CardContent className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2 font-bengali">
              {language === 'bn' ? 'সব পরিশোধিত!' : 'All Paid!'}
            </h2>
            <p className="text-muted-foreground max-w-sm mx-auto">
              {language === 'bn' 
                ? 'আপনার কোনো বকেয়া নেই। ধন্যবাদ আপনার নিয়মিত পেমেন্টের জন্য।' 
                : 'You have no outstanding dues. Thank you for staying on top of your payments!'}
            </p>
            <div className="mt-4 text-sm text-success">
              <TrendingUp className="inline-block h-4 w-4 mr-1" />
              {language === 'bn' 
                ? `মোট পরিশোধিত: ${formatCurrency(duesData.totalPaid)}` 
                : `Total paid: ${formatCurrency(duesData.totalPaid)}`}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Overdue Warning */}
          {hasOverdue && (
            <Alert variant="destructive" className="border-destructive/50 bg-destructive/5">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="font-bengali">
                {language === 'bn' ? 'বিলম্বিত বকেয়া' : 'Overdue Dues'}
              </AlertTitle>
              <AlertDescription>
                {language === 'bn' 
                  ? `আপনার ${duesData.overdueCount} টি বকেয়া বিলম্বিত হয়েছে (${formatCurrency(duesData.overdueAmount)})। অনুগ্রহ করে যত তাড়াতাড়ি সম্ভব পরিশোধ করুন।` 
                  : `You have ${duesData.overdueCount} overdue due(s) totaling ${formatCurrency(duesData.overdueAmount)}. Please clear them at your earliest convenience.`}
              </AlertDescription>
            </Alert>
          )}

          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card className={hasOverdue ? 'border-destructive/30' : ''}>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  {language === 'bn' ? 'মোট বকেয়া' : 'Total Due'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className={`text-3xl font-bold ${hasOverdue ? 'text-destructive' : 'text-foreground'}`}>
                  {formatCurrency(duesData.totalDue)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {duesData.unpaidCount + duesData.partialCount} {language === 'bn' ? 'টি বাকি' : 'pending'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  {language === 'bn' ? 'মোট পরিশোধিত' : 'Total Paid'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-success">
                  {formatCurrency(duesData.totalPaid)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {duesData.paidCount} {language === 'bn' ? 'টি পরিশোধিত' : 'completed'}
                </p>
              </CardContent>
            </Card>

            {duesData.monthlyAmount > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {language === 'bn' ? 'মাসিক চাঁদা' : 'Monthly Rate'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-foreground">
                    {formatCurrency(duesData.monthlyAmount)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {language === 'bn' ? 'প্রতি মাসে' : 'per month'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Dues List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-bengali">
                <Clock className="h-5 w-5" />
                {language === 'bn' ? 'বকেয়ার তালিকা' : 'Dues History'}
              </CardTitle>
              <CardDescription>
                {language === 'bn' 
                  ? 'আপনার সকল মাসিক চাঁদার বিবরণ' 
                  : 'Details of all your monthly contributions'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {duesData.dues.map((due) => {
                  const currentMonth = format(new Date(), 'yyyy-MM');
                  const isOverdue = (due.status === 'unpaid' || due.status === 'partial') && due.due_month < currentMonth;
                  const remaining = due.amount - due.paid_amount;
                  
                  return (
                    <div 
                      key={due.id}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                        isOverdue 
                          ? 'border-destructive/30 bg-destructive/5' 
                          : due.status === 'paid'
                            ? 'border-success/20 bg-success/5'
                            : 'border-border hover:bg-muted/50'
                      }`}
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-foreground font-bengali">
                            {formatMonth(due.due_month)}
                          </p>
                          {getStatusBadge(due.status)}
                          {isOverdue && (
                            <Badge variant="outline" className="text-destructive border-destructive/50 text-xs">
                              {language === 'bn' ? 'বিলম্বিত' : 'Overdue'}
                            </Badge>
                          )}
                        </div>
                        {due.contribution_type && (
                          <p className="text-sm text-muted-foreground">
                            {language === 'bn' && due.contribution_type.name_bn 
                              ? due.contribution_type.name_bn 
                              : due.contribution_type.name}
                          </p>
                        )}
                      </div>
                      
                      <div className="text-right shrink-0 ml-4">
                        <p className={`font-semibold ${
                          due.status === 'paid' 
                            ? 'text-success' 
                            : isOverdue 
                              ? 'text-destructive' 
                              : 'text-foreground'
                        }`}>
                          {formatCurrency(due.amount)}
                        </p>
                        {due.status === 'partial' && (
                          <p className="text-xs text-warning">
                            {language === 'bn' ? 'বাকি:' : 'Remaining:'} {formatCurrency(remaining)}
                          </p>
                        )}
                        {due.status === 'paid' && (
                          <p className="text-xs text-success">
                            {language === 'bn' ? 'সম্পূর্ণ পরিশোধিত' : 'Fully paid'}
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
          <Alert className="border-primary/30 bg-primary/5">
            <Info className="h-4 w-4 text-primary" />
            <AlertDescription className="text-primary/90 font-bengali">
              {language === 'bn' 
                ? 'বকেয়া পরিশোধ করতে আপনার সমিতির ম্যানেজারের সাথে যোগাযোগ করুন অথবা অনলাইন পেমেন্ট অপশন ব্যবহার করুন।' 
                : 'To pay your dues, please contact your somiti manager or use the online payment option if available.'}
            </AlertDescription>
          </Alert>
        </>
      )}
    </div>
  );
}
