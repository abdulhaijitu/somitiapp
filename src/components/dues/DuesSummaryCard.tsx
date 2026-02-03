import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTenant } from '@/contexts/TenantContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

interface DuesSummary {
  total_dues: number;
  total_amount: number;
  paid_amount: number;
  unpaid_count: number;
  partial_count: number;
  paid_count: number;
}

interface DuesSummaryCardProps {
  month?: Date;
}

export function DuesSummaryCard({ month = new Date() }: DuesSummaryCardProps) {
  const { language } = useLanguage();
  const { tenant } = useTenant();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<DuesSummary | null>(null);

  const dueMonthStr = format(new Date(month.getFullYear(), month.getMonth(), 1), 'yyyy-MM-dd');

  useEffect(() => {
    if (tenant?.id) {
      fetchSummary();
    }
  }, [tenant?.id, dueMonthStr]);

  const fetchSummary = async () => {
    if (!tenant?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('dues')
        .select('amount, paid_amount, status')
        .eq('tenant_id', tenant.id)
        .eq('due_month', dueMonthStr);

      if (error) throw error;

      const dues = data || [];
      const summary: DuesSummary = {
        total_dues: dues.length,
        total_amount: dues.reduce((sum, d) => sum + Number(d.amount), 0),
        paid_amount: dues.reduce((sum, d) => sum + Number(d.paid_amount), 0),
        unpaid_count: dues.filter(d => d.status === 'unpaid').length,
        partial_count: dues.filter(d => d.status === 'partial').length,
        paid_count: dues.filter(d => d.status === 'paid').length,
      };

      setSummary(summary);
    } catch (error) {
      console.error('Error fetching dues summary:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!summary || summary.total_dues === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {language === 'bn' ? 'মাসিক বকেয়া সারসংক্ষেপ' : 'Monthly Dues Summary'}
          </CardTitle>
          <CardDescription>
            {format(month, 'MMMM yyyy')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {language === 'bn' 
              ? 'এই মাসে কোনো বকেয়া তৈরি হয়নি'
              : 'No dues generated for this month'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const outstandingAmount = summary.total_amount - summary.paid_amount;
  const collectionRate = summary.total_amount > 0 
    ? Math.round((summary.paid_amount / summary.total_amount) * 100)
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          {language === 'bn' ? 'মাসিক বকেয়া সারসংক্ষেপ' : 'Monthly Dues Summary'}
        </CardTitle>
        <CardDescription>
          {format(month, 'MMMM yyyy')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Amount Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              {language === 'bn' ? 'মোট বকেয়া' : 'Total Due'}
            </p>
            <p className="text-2xl font-bold">৳{summary.total_amount.toLocaleString()}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              {language === 'bn' ? 'আদায়' : 'Collected'}
            </p>
            <p className="text-2xl font-bold text-success">৳{summary.paid_amount.toLocaleString()}</p>
          </div>
        </div>

        {/* Outstanding */}
        {outstandingAmount > 0 && (
          <div className="rounded-lg bg-destructive/10 p-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm font-medium text-destructive">
                {language === 'bn' ? 'বাকি' : 'Outstanding'}: ৳{outstandingAmount.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* Status Breakdown */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-destructive/10 p-2">
            <p className="text-lg font-bold text-destructive">{summary.unpaid_count}</p>
            <p className="text-xs text-muted-foreground">{language === 'bn' ? 'বকেয়া' : 'Unpaid'}</p>
          </div>
          <div className="rounded-lg bg-warning/10 p-2">
            <p className="text-lg font-bold text-warning">{summary.partial_count}</p>
            <p className="text-xs text-muted-foreground">{language === 'bn' ? 'আংশিক' : 'Partial'}</p>
          </div>
          <div className="rounded-lg bg-success/10 p-2">
            <p className="text-lg font-bold text-success">{summary.paid_count}</p>
            <p className="text-xs text-muted-foreground">{language === 'bn' ? 'পরিশোধিত' : 'Paid'}</p>
          </div>
        </div>

        {/* Collection Rate */}
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-sm text-muted-foreground">
            {language === 'bn' ? 'আদায়ের হার' : 'Collection Rate'}
          </span>
          <div className="flex items-center gap-2">
            {collectionRate === 100 && <CheckCircle className="h-4 w-4 text-success" />}
            <span className={`text-lg font-bold ${collectionRate >= 80 ? 'text-success' : collectionRate >= 50 ? 'text-warning' : 'text-destructive'}`}>
              {collectionRate}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
