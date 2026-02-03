import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, TrendingUp, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

interface AdvanceBalanceCardProps {
  advanceBalance: number;
  loading?: boolean;
  showExplanation?: boolean;
  compact?: boolean;
}

export function AdvanceBalanceCard({ 
  advanceBalance, 
  loading = false,
  showExplanation = true,
  compact = false
}: AdvanceBalanceCardProps) {
  const { language } = useLanguage();

  if (loading) {
    return compact ? (
      <Skeleton className="h-12 w-32" />
    ) : (
      <Card>
        <CardContent className="py-6">
          <Skeleton className="h-8 w-24" />
        </CardContent>
      </Card>
    );
  }

  if (advanceBalance <= 0) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return language === 'bn' 
      ? `৳${amount.toLocaleString('bn-BD')}` 
      : `৳${amount.toLocaleString()}`;
  };

  if (compact) {
    return (
      <Badge className="bg-primary/10 text-primary border-primary/30 gap-1">
        <Wallet className="h-3 w-3" />
        {language === 'bn' ? 'অগ্রিম:' : 'Advance:'} {formatCurrency(advanceBalance)}
      </Badge>
    );
  }

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <Wallet className="h-4 w-4 text-primary" />
          </div>
          {language === 'bn' ? 'অগ্রিম ব্যালেন্স' : 'Advance Balance'}
        </CardTitle>
        <CardDescription>
          {language === 'bn' 
            ? 'আপনার অতিরিক্ত পরিশোধিত অর্থ' 
            : 'Your excess payment balance'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-primary">
            {formatCurrency(advanceBalance)}
          </span>
          <Badge variant="outline" className="text-primary border-primary/30">
            <TrendingUp className="h-3 w-3 mr-1" />
            {language === 'bn' ? 'অগ্রিম' : 'Advance'}
          </Badge>
        </div>

        {showExplanation && (
          <Alert className="border-primary/20 bg-primary/5">
            <Info className="h-4 w-4 text-primary" />
            <AlertDescription className="text-sm text-primary/80">
              {language === 'bn' 
                ? 'এই অর্থ আপনার পরবর্তী মাসের চাঁদার সাথে স্বয়ংক্রিয়ভাবে সমন্বয় হবে।'
                : 'This amount will be automatically applied to your future contributions.'}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
