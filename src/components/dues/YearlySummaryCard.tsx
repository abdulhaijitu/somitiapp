import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  ShieldCheck, 
  AlertTriangle,
  Calendar,
  Wallet,
  ArrowRightLeft
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { YearlySummary } from '@/hooks/useYearlySummary';

interface YearlySummaryCardProps {
  summary: YearlySummary | null;
  loading: boolean;
  variant?: 'admin' | 'member';
}

export function YearlySummaryCard({ summary, loading, variant = 'admin' }: YearlySummaryCardProps) {
  const { language } = useLanguage();

  const formatCurrency = (amount: number) => {
    return language === 'bn' 
      ? `৳${amount.toLocaleString('bn-BD')}` 
      : `৳${amount.toLocaleString()}`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-8 w-full" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summary) return null;

  const usagePercent = Math.min(summary.cap_usage_percent, 100);
  const progressColor = summary.is_at_limit 
    ? 'bg-destructive' 
    : summary.is_near_limit 
      ? 'bg-warning' 
      : 'bg-primary';

  return (
    <Card className={
      summary.is_at_limit 
        ? 'border-destructive/30' 
        : summary.is_near_limit 
          ? 'border-warning/30' 
          : 'border-border'
    }>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {language === 'bn' 
              ? `বার্ষিক সারসংক্ষেপ ${summary.year}` 
              : `Yearly Summary ${summary.year}`}
          </span>
          {summary.is_at_limit ? (
            <Badge variant="destructive" className="text-xs">
              {language === 'bn' ? 'সীমা পূর্ণ' : 'Limit Reached'}
            </Badge>
          ) : summary.is_near_limit ? (
            <Badge className="bg-warning/10 text-warning border-warning/30 text-xs">
              {language === 'bn' ? 'সীমার কাছে' : 'Near Limit'}
            </Badge>
          ) : (
            <Badge className="bg-success/10 text-success border-success/30 text-xs">
              <ShieldCheck className="h-3 w-3 mr-1" />
              {language === 'bn' ? 'সীমার মধ্যে' : 'Within Limit'}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {language === 'bn' ? 'ব্যবহার' : 'Usage'}
            </span>
            <span className="font-medium">
              {usagePercent}%
            </span>
          </div>
          <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatCurrency(summary.total_paid)}</span>
            <span>{formatCurrency(summary.yearly_cap)}</span>
          </div>
        </div>

        {/* Warning */}
        {summary.is_at_limit && (
          <Alert variant="destructive" className="py-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {variant === 'member'
                ? (language === 'bn' 
                    ? 'আপনি বার্ষিক চাঁদা সীমায় পৌঁছেছেন।'
                    : 'You have reached your yearly contribution limit.')
                : (language === 'bn' 
                    ? 'এই সদস্য বার্ষিক চাঁদা সীমায় পৌঁছেছে। নতুন পেমেন্ট বা বকেয়া তৈরি করা যাবে না।'
                    : 'This member has reached their yearly cap. No new payments or dues can be created.')}
            </AlertDescription>
          </Alert>
        )}

        {summary.is_near_limit && !summary.is_at_limit && (
          <Alert className="border-warning/30 bg-warning/5 py-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <AlertDescription className="text-xs text-warning">
              {language === 'bn' 
                ? `সতর্কতা: বার্ষিক সীমার ${usagePercent}% ব্যবহৃত হয়েছে।`
                : `Warning: ${usagePercent}% of yearly cap used.`}
            </AlertDescription>
          </Alert>
        )}

        {/* Breakdown */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <TrendingUp className="h-3 w-3" />
              {language === 'bn' ? 'বার্ষিক সীমা' : 'Yearly Cap'}
            </div>
            <p className="text-lg font-bold text-foreground">
              {formatCurrency(summary.yearly_cap)}
            </p>
          </div>

          <div className="rounded-lg border border-border p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <Wallet className="h-3 w-3" />
              {language === 'bn' ? 'অবশিষ্ট' : 'Remaining'}
            </div>
            <p className={`text-lg font-bold ${summary.remaining_allowance > 0 ? 'text-success' : 'text-destructive'}`}>
              {formatCurrency(summary.remaining_allowance)}
            </p>
          </div>
        </div>

        {/* Detailed breakdown for admin */}
        {variant === 'admin' && (
          <div className="space-y-2 pt-2 border-t border-border">
            <p className="text-xs font-medium text-muted-foreground">
              {language === 'bn' ? 'বিস্তারিত হিসাব' : 'Cap Breakdown'}
            </p>
            <div className="grid grid-cols-1 gap-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {language === 'bn' ? 'মাসিক (১২ × ' : 'Monthly (12 × '}{formatCurrency(summary.monthly_base)})
                </span>
                <span className="font-medium">{formatCurrency(summary.monthly_cap)}</span>
              </div>
              {summary.fund_raise_total > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {language === 'bn' ? 'ফান্ড রেইজ' : 'Fund Raise'}
                  </span>
                  <span className="font-medium">{formatCurrency(summary.fund_raise_total)}</span>
                </div>
              )}
              {summary.others_total > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {language === 'bn' ? 'অন্যান্য' : 'Others'}
                  </span>
                  <span className="font-medium">{formatCurrency(summary.others_total)}</span>
                </div>
              )}
              {summary.carry_forward_unpaid > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <ArrowRightLeft className="h-3 w-3" />
                    {language === 'bn' ? 'গত বছর থেকে বকেয়া' : 'Carry Forward'}
                  </span>
                  <span className="font-medium text-warning">{formatCurrency(summary.carry_forward_unpaid)}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
