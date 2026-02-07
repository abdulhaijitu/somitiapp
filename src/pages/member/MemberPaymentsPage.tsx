import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTenant } from '@/contexts/TenantContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { PaymentStatusBadge } from '@/components/payments/PaymentStatusBadge';
import { PaymentMethodBadge } from '@/components/payments/PaymentMethodBadge';
import { 
  CreditCard, 
  ChevronLeft, 
  ChevronRight,
  Calendar,
  Receipt
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

const ITEMS_PER_PAGE = 10;

export function MemberPaymentsPage() {
  const { language } = useLanguage();
  const { tenant, userId } = useTenant();
  const [page, setPage] = useState(1);

  // Fetch member data first
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

  // Fetch payments with pagination
  const { data: paymentsData, isLoading } = useQuery({
    queryKey: ['member-payments', memberData?.id, page],
    queryFn: async () => {
      if (!memberData?.id) return { payments: [], total: 0 };

      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data: payments, error, count } = await supabase
        .from('payments')
        .select('*', { count: 'exact' })
        .eq('member_id', memberData.id)
        .eq('tenant_id', tenant!.id)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      return {
        payments: payments || [],
        total: count || 0
      };
    },
    enabled: !!memberData?.id,
    refetchOnWindowFocus: true,
    refetchInterval: 30000
  });

  const totalPages = Math.ceil((paymentsData?.total || 0) / ITEMS_PER_PAGE);

  const formatCurrency = (amount: number) => {
    return language === 'bn' 
      ? `৳${amount.toLocaleString('bn-BD')}` 
      : `৳${amount.toLocaleString()}`;
  };

  const formatPeriod = (month: number | null, year: number | null) => {
    if (!month || !year) return '-';
    const monthNames = language === 'bn' 
      ? ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর']
      : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${monthNames[month - 1]} ${year}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground lg:text-3xl font-bengali">
          {language === 'bn' ? 'আমার পেমেন্ট' : 'My Payments'}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {language === 'bn' 
            ? 'আপনার সমস্ত পেমেন্টের ইতিহাস দেখুন' 
            : 'View your complete payment history'}
        </p>
      </div>

      {/* Summary Card */}
      {paymentsData && paymentsData.total > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-4 px-6">
            <div className="flex items-center gap-3">
              <Receipt className="h-5 w-5 text-primary" />
              <span className="text-sm text-foreground">
                {language === 'bn' 
                  ? `মোট ${paymentsData.total} টি পেমেন্ট রেকর্ড পাওয়া গেছে` 
                  : `${paymentsData.total} payment records found`}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payments List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-bengali">
            <CreditCard className="h-5 w-5" />
            {language === 'bn' ? 'পেমেন্ট তালিকা' : 'Payment List'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : !paymentsData || paymentsData.payments.length === 0 ? (
            <EmptyState
              icon={<CreditCard className="h-12 w-12" />}
              title={language === 'bn' ? 'কোনো পেমেন্ট নেই' : 'No Payments Yet'}
              description={language === 'bn' 
                ? 'আপনার কোনো পেমেন্ট রেকর্ড পাওয়া যায়নি।' 
                : 'You don\'t have any payment records yet.'}
            />
          ) : (
            <div className="space-y-3">
              {paymentsData.payments.map((payment) => (
                <div 
                  key={payment.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border border-border rounded-xl hover:bg-muted/30 transition-colors"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-foreground">
                        {formatCurrency(payment.amount)}
                      </span>
                      <PaymentStatusBadge status={payment.status} />
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {payment.payment_date 
                          ? format(new Date(payment.payment_date), 'd MMM yyyy')
                          : format(new Date(payment.created_at), 'd MMM yyyy')
                        }
                      </span>
                      <span>•</span>
                      <span>{formatPeriod(payment.period_month, payment.period_year)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <PaymentMethodBadge method={payment.payment_method} />
                    <Badge variant={payment.payment_type === 'online' ? 'default' : 'secondary'}>
                      {payment.payment_type === 'online' 
                        ? (language === 'bn' ? 'অনলাইন' : 'Online') 
                        : (language === 'bn' ? 'অফলাইন' : 'Offline')}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                {language === 'bn' 
                  ? `পৃষ্ঠা ${page} / ${totalPages}` 
                  : `Page ${page} of ${totalPages}`}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
