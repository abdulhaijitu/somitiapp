import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { fetchPlans, PlanConfig, formatPrice, planFeatures } from '@/lib/plans';
import { useQuery } from '@tanstack/react-query';
import { SkeletonLoader } from '@/components/ui/skeleton-loader';
import { 
  Check, 
  X, 
  Crown, 
  Sparkles,
  Users,
  CreditCard,
  MessageSquare,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlanComparisonCardProps {
  onSelectPlan?: (plan: PlanConfig) => void;
  currentPlan?: string;
}

export function PlanComparisonCard({ onSelectPlan, currentPlan }: PlanComparisonCardProps) {
  const { language } = useLanguage();

  const { data: plans, isLoading } = useQuery({
    queryKey: ['plan-configs'],
    queryFn: fetchPlans
  });

  if (isLoading) {
    return <SkeletonLoader variant="card" count={3} />;
  }

  // Filter out custom plan for comparison display
  const displayPlans = plans?.filter(p => p.plan !== 'custom') || [];

  const getFeatureIcon = (feature: string) => {
    if (feature.toLowerCase().includes('member')) return <Users className="h-4 w-4" />;
    if (feature.toLowerCase().includes('payment')) return <CreditCard className="h-4 w-4" />;
    if (feature.toLowerCase().includes('sms')) return <MessageSquare className="h-4 w-4" />;
    if (feature.toLowerCase().includes('report')) return <FileText className="h-4 w-4" />;
    return <Check className="h-4 w-4" />;
  };

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {displayPlans.map((plan) => {
        const features = planFeatures[plan.plan as keyof typeof planFeatures] || planFeatures.standard;
        const isCurrentPlan = currentPlan === plan.plan;
        const isPremium = plan.plan === 'premium';

        return (
          <Card 
            key={plan.id}
            className={cn(
              'relative border-border transition-all',
              plan.is_popular && 'border-primary/50 shadow-lg shadow-primary/10',
              isCurrentPlan && 'ring-2 ring-primary'
            )}
          >
            {/* Popular Badge */}
            {plan.is_popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground px-3">
                  <Sparkles className="h-3 w-3 mr-1" />
                  {language === 'bn' ? 'জনপ্রিয়' : 'Popular'}
                </Badge>
              </div>
            )}

            <CardHeader className="text-center pb-4 pt-6">
              {/* Plan Icon */}
              <div className={cn(
                "mx-auto flex h-14 w-14 items-center justify-center rounded-2xl mb-3",
                isPremium ? "bg-primary/10" : "bg-muted"
              )}>
                {isPremium ? (
                  <Crown className="h-7 w-7 text-primary" />
                ) : (
                  <div className="h-7 w-7 rounded-full border-2 border-muted-foreground/30" />
                )}
              </div>

              <CardTitle className="text-xl">
                {language === 'bn' && plan.name_bn ? plan.name_bn : plan.name}
              </CardTitle>
              <CardDescription className="min-h-[40px]">
                {language === 'bn' && plan.description_bn ? plan.description_bn : plan.description}
              </CardDescription>

              {/* Pricing */}
              <div className="mt-4">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-bold text-foreground">
                    {formatPrice(plan.monthly_price)}
                  </span>
                  <span className="text-muted-foreground">
                    /{language === 'bn' ? 'মাস' : 'mo'}
                  </span>
                </div>
                {plan.yearly_price && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatPrice(plan.yearly_price)}/{language === 'bn' ? 'বছর' : 'year'}
                    <span className="text-success ml-1">
                      ({language === 'bn' ? '২ মাস বাঁচান' : 'Save 2 months'})
                    </span>
                  </p>
                )}
              </div>
            </CardHeader>

            <Separator />

            <CardContent className="pt-6 space-y-4">
              {/* Key Limits */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {language === 'bn' ? 'সদস্য' : 'Members'}
                  </span>
                  <span className="font-medium">
                    {plan.max_members_unlimited 
                      ? (language === 'bn' ? 'আনলিমিটেড' : 'Unlimited')
                      : plan.max_members}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    SMS/{language === 'bn' ? 'মাস' : 'month'}
                  </span>
                  <span className="font-medium">{plan.sms_monthly_quota}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    {language === 'bn' ? 'অনলাইন পেমেন্ট' : 'Online Payments'}
                  </span>
                  {plan.online_payments_enabled ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : (
                    <X className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {language === 'bn' ? 'রিপোর্ট হিস্ট্রি' : 'Report History'}
                  </span>
                  <span className="font-medium">
                    {plan.report_history_months} {language === 'bn' ? 'মাস' : 'months'}
                  </span>
                </div>
              </div>

              <Separator />

              {/* Feature List */}
              <div className="space-y-2">
                {features.highlights.slice(0, 4).map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-success flex-shrink-0" />
                    <span className="text-foreground/80">
                      {language === 'bn' ? feature.bn : feature.en}
                    </span>
                  </div>
                ))}
                {features.limitations.map((limitation, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <X className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground">
                      {language === 'bn' ? limitation.bn : limitation.en}
                    </span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <Button 
                className={cn(
                  "w-full mt-4",
                  isCurrentPlan 
                    ? "bg-muted text-muted-foreground cursor-default" 
                    : plan.is_popular 
                      ? "bg-gradient-primary hover:opacity-90"
                      : ""
                )}
                variant={plan.is_popular ? "default" : "outline"}
                disabled={isCurrentPlan}
                onClick={() => onSelectPlan?.(plan)}
              >
                {isCurrentPlan 
                  ? (language === 'bn' ? 'বর্তমান প্ল্যান' : 'Current Plan')
                  : (language === 'bn' ? 'নির্বাচন করুন' : 'Select Plan')}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
