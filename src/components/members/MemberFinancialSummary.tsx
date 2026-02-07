import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  TrendingUp, 
  CreditCard, 
  AlertCircle, 
  Wallet,
  Calendar,
  ShieldCheck,
  AlertTriangle,
  ArrowRightLeft
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useYearlySummary, YearlySummary } from '@/hooks/useYearlySummary';
import { useMemberYears } from '@/hooks/useMemberYears';
import { YearSelector } from '@/components/common/YearSelector';

interface MemberFinancialSummaryProps {
  memberId: string | null;
  tenantId: string | null;
  joinedAt?: string | null;
  createdAt?: string | null;
  advanceBalance?: number;
  variant?: 'admin' | 'member';
}

export function MemberFinancialSummary({
  memberId,
  tenantId,
  joinedAt,
  createdAt,
  advanceBalance = 0,
  variant = 'admin'
}: MemberFinancialSummaryProps) {
  const { language } = useLanguage();

  // Year selector
  const { years, currentYear } = useMemberYears(memberId, tenantId, joinedAt, createdAt);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Reset year when member changes
  useEffect(() => {
    setSelectedYear(currentYear);
  }, [memberId, currentYear]);

  // Fetch yearly summary for selected year
  const { data: summary, isLoading } = useYearlySummary(memberId, tenantId, selectedYear);

  const formatCurrency = (amount: number) => {
    return language === 'bn' 
      ? `৳${amount.toLocaleString('bn-BD')}` 
      : `৳${amount.toLocaleString()}`;
  };

  const usagePercent = summary ? Math.min(summary.cap_usage_percent, 100) : 0;

  return (
    <div className="space-y-4">
      {/* Header with Year Selector */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            {language === 'bn' ? 'আর্থিক সারসংক্ষেপ' : 'Financial Summary'}
          </h3>
          {summary && (
            <StatusBadge summary={summary} language={language} />
          )}
        </div>

        {years.length > 1 && (
          <YearSelector
            years={years}
            selectedYear={selectedYear}
            onYearChange={setSelectedYear}
          />
        )}
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-8 w-full" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        </div>
      ) : !summary ? (
        /* Empty State */
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <Calendar className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground">
              {language === 'bn' 
                ? `${selectedYear} সালের কোনো তথ্য নেই` 
                : `No records for ${selectedYear}`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Progress Bar */}
          <div className="rounded-lg border border-border p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {language === 'bn' ? `${selectedYear} সালের ব্যবহার` : `${selectedYear} Usage`}
              </span>
              <span className="font-semibold text-foreground">{usagePercent}%</span>
            </div>
            <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  summary.is_at_limit 
                    ? 'bg-destructive' 
                    : summary.is_near_limit 
                      ? 'bg-warning' 
                      : 'bg-primary'
                }`}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatCurrency(summary.total_paid)}</span>
              <span>{formatCurrency(summary.yearly_cap)}</span>
            </div>
          </div>

          {/* Warning Alerts */}
          {summary.is_at_limit && (
            <Alert variant="destructive" className="py-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                {variant === 'member'
                  ? (language === 'bn' 
                      ? 'আপনি বার্ষিক চাঁদা সীমায় পৌঁছেছেন।'
                      : 'You have reached your yearly contribution limit.')
                  : (language === 'bn' 
                      ? 'এই সদস্য বার্ষিক চাঁদা সীমায় পৌঁছেছে।'
                      : 'This member has reached their yearly cap.')}
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

          {/* Financial Cards Grid */}
          <div className="grid grid-cols-2 gap-3">
            <FinancialCard
              icon={<TrendingUp className="h-3.5 w-3.5" />}
              label={language === 'bn' ? 'বার্ষিক সীমা' : 'Yearly Limit'}
              value={formatCurrency(summary.yearly_cap)}
              className="text-foreground"
            />
            <FinancialCard
              icon={<CreditCard className="h-3.5 w-3.5" />}
              label={language === 'bn' ? 'মোট পরিশোধ' : 'Total Paid'}
              value={formatCurrency(summary.total_paid)}
              className="text-success"
            />
            <FinancialCard
              icon={<AlertCircle className="h-3.5 w-3.5" />}
              label={language === 'bn' ? 'বকেয়া' : 'Outstanding'}
              value={formatCurrency(summary.outstanding_balance)}
              className={summary.outstanding_balance > 0 ? 'text-destructive' : 'text-foreground'}
            />
            <FinancialCard
              icon={<Wallet className="h-3.5 w-3.5" />}
              label={language === 'bn' ? 'অবশিষ্ট' : 'Remaining'}
              value={formatCurrency(summary.remaining_allowance)}
              className={summary.remaining_allowance > 0 ? 'text-success' : 'text-destructive'}
            />
          </div>

          {/* Advance Balance */}
          {advanceBalance > 0 && (
            <div className="rounded-lg border border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 p-3">
              <div className="flex items-center gap-2 text-xs text-primary">
                <Wallet className="h-3.5 w-3.5" />
                {language === 'bn' ? 'অগ্রিম ব্যালেন্স' : 'Advance Balance'}
              </div>
              <p className="mt-0.5 text-lg font-bold text-primary">
                {formatCurrency(advanceBalance)}
              </p>
            </div>
          )}

          {/* Cap Breakdown (admin only) */}
          {variant === 'admin' && (
            <div className="space-y-2 rounded-lg border border-border p-3">
              <p className="text-xs font-medium text-muted-foreground">
                {language === 'bn' ? 'সীমা বিশ্লেষণ' : 'Cap Breakdown'}
              </p>
              <div className="grid grid-cols-1 gap-1.5 text-xs">
                <BreakdownRow
                  label={`${language === 'bn' ? 'মাসিক (১২ × ' : 'Monthly (12 × '}${formatCurrency(summary.monthly_base)})`}
                  value={formatCurrency(summary.monthly_cap)}
                />
                {summary.fund_raise_total > 0 && (
                  <BreakdownRow
                    label={language === 'bn' ? 'ফান্ড রেইজ' : 'Fund Raise'}
                    value={formatCurrency(summary.fund_raise_total)}
                  />
                )}
                {summary.others_total > 0 && (
                  <BreakdownRow
                    label={language === 'bn' ? 'অন্যান্য' : 'Others'}
                    value={formatCurrency(summary.others_total)}
                  />
                )}
                {summary.carry_forward_unpaid > 0 && (
                  <BreakdownRow
                    label={
                      <span className="flex items-center gap-1">
                        <ArrowRightLeft className="h-3 w-3" />
                        {language === 'bn' 
                          ? `${selectedYear - 1} থেকে বকেয়া` 
                          : `Carried from ${selectedYear - 1}`}
                      </span>
                    }
                    value={formatCurrency(summary.carry_forward_unpaid)}
                    valueClassName="text-warning"
                  />
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// --- Sub-components ---

function StatusBadge({ summary, language }: { summary: YearlySummary; language: string }) {
  if (summary.is_at_limit) {
    return (
      <Badge variant="destructive" className="text-xs">
        {language === 'bn' ? 'সীমা পূর্ণ' : 'Limit Reached'}
      </Badge>
    );
  }
  if (summary.is_near_limit) {
    return (
      <Badge className="bg-warning/10 text-warning border-warning/30 text-xs">
        {language === 'bn' ? 'সীমার কাছে' : 'Near Limit'}
      </Badge>
    );
  }
  return (
    <Badge className="bg-success/10 text-success border-success/30 text-xs">
      <ShieldCheck className="h-3 w-3 mr-1" />
      {language === 'bn' ? 'সীমার মধ্যে' : 'Within Limit'}
    </Badge>
  );
}

function FinancialCard({ 
  icon, label, value, className = '' 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  className?: string;
}) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
        {icon}
        {label}
      </div>
      <p className={`text-lg font-bold ${className}`}>{value}</p>
    </div>
  );
}

function BreakdownRow({ 
  label, value, valueClassName = '' 
}: { 
  label: React.ReactNode; 
  value: string; 
  valueClassName?: string;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium ${valueClassName}`}>{value}</span>
    </div>
  );
}
