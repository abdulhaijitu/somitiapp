import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTenant } from '@/contexts/TenantContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { SkeletonLoader } from '@/components/ui/skeleton-loader';
import { UsageMeter } from './UsageMeter';
import { 
  CreditCard, 
  Calendar, 
  Users, 
  MessageSquare, 
  ArrowUpRight,
  Crown,
  Sparkles,
  Clock
} from 'lucide-react';
import { getTenantPlanInfo, TenantPlanInfo, formatPrice, planFeatures } from '@/lib/plans';
import { format, differenceInDays } from 'date-fns';
import { useQuery } from '@tanstack/react-query';

interface TenantBillingCardProps {
  onRequestUpgrade?: () => void;
}

export function TenantBillingCard({ onRequestUpgrade }: TenantBillingCardProps) {
  const { language } = useLanguage();
  const { tenant } = useTenant();

  const { data: planInfo, isLoading, error } = useQuery({
    queryKey: ['tenant-plan-info', tenant?.id],
    queryFn: () => getTenantPlanInfo(tenant!.id),
    enabled: !!tenant?.id,
    staleTime: 60000 // Cache for 1 minute
  });

  if (isLoading) {
    return <SkeletonLoader variant="card" />;
  }

  if (error || !planInfo || planInfo.error) {
    return (
      <Card className="border-border">
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">
            {language === 'bn' ? 'বিলিং তথ্য লোড করতে সমস্যা হয়েছে' : 'Unable to load billing information'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const endDate = new Date(planInfo.subscription_end_date);
  const daysRemaining = differenceInDays(endDate, new Date());
  const isExpiringSoon = daysRemaining <= 7 && daysRemaining > 0;
  const isExpired = daysRemaining <= 0;

  const planName = language === 'bn' ? planInfo.plan_name_bn || planInfo.plan_name : planInfo.plan_name;
  const features = planFeatures[planInfo.plan] || planFeatures.standard;

  const getPlanBadgeVariant = () => {
    switch (planInfo.plan) {
      case 'premium': return 'default';
      case 'custom': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              {planInfo.plan === 'premium' ? (
                <Crown className="h-6 w-6 text-primary" />
              ) : (
                <CreditCard className="h-6 w-6 text-primary" />
              )}
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                {language === 'bn' ? 'বর্তমান প্ল্যান' : 'Current Plan'}
                <Badge variant={getPlanBadgeVariant()} className="ml-2">
                  {planName}
                </Badge>
              </CardTitle>
              <CardDescription>
                {planInfo.subscription_status === 'active' 
                  ? (language === 'bn' ? 'সক্রিয় সাবস্ক্রিপশন' : 'Active subscription')
                  : (language === 'bn' ? 'নিষ্ক্রিয়' : 'Inactive')}
              </CardDescription>
            </div>
          </div>
          {onRequestUpgrade && planInfo.plan !== 'custom' && (
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={onRequestUpgrade}
            >
              <ArrowUpRight className="h-4 w-4" />
              {language === 'bn' ? 'আপগ্রেড' : 'Upgrade'}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Subscription Status */}
        <div className={`flex items-center gap-3 rounded-lg border p-4 ${
          isExpired ? 'border-destructive/50 bg-destructive/5' :
          isExpiringSoon ? 'border-warning/50 bg-warning/5' :
          'border-success/50 bg-success/5'
        }`}>
          <Clock className={`h-5 w-5 ${
            isExpired ? 'text-destructive' :
            isExpiringSoon ? 'text-warning' :
            'text-success'
          }`} />
          <div className="flex-1">
            <p className="text-sm font-medium">
              {isExpired 
                ? (language === 'bn' ? 'সাবস্ক্রিপশন মেয়াদ শেষ' : 'Subscription Expired')
                : isExpiringSoon
                  ? (language === 'bn' ? 'শীঘ্রই মেয়াদ শেষ হবে' : 'Expiring Soon')
                  : (language === 'bn' ? 'সাবস্ক্রিপশন সক্রিয়' : 'Subscription Active')}
            </p>
            <p className="text-xs text-muted-foreground">
              {language === 'bn' ? 'মেয়াদ:' : 'Valid until:'}{' '}
              {format(endDate, 'dd MMM yyyy')}
              {!isExpired && (
                <span className="ml-2">
                  ({daysRemaining} {language === 'bn' ? 'দিন বাকি' : 'days remaining'})
                </span>
              )}
            </p>
          </div>
          {(isExpired || isExpiringSoon) && (
            <Button size="sm" className="bg-gradient-primary">
              {language === 'bn' ? 'রিনিউ করুন' : 'Renew'}
            </Button>
          )}
        </div>

        <Separator />

        {/* Usage Section */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            {language === 'bn' ? 'ব্যবহার' : 'Usage'}
          </h4>

          <div className="grid gap-4 sm:grid-cols-2">
            <UsageMeter
              label="Members"
              labelBn="সদস্য"
              current={planInfo.usage.member_count}
              max={planInfo.limits.max_members}
            />
            <UsageMeter
              label="SMS This Month"
              labelBn="এই মাসে SMS"
              current={planInfo.usage.sms_used}
              max={planInfo.limits.sms_quota}
            />
          </div>

          {/* Add-on indicators */}
          {(planInfo.limits.max_members_addon > 0 || planInfo.limits.sms_quota_addon > 0) && (
            <div className="flex flex-wrap gap-2 mt-2">
              {planInfo.limits.max_members_addon > 0 && (
                <Badge variant="secondary" className="text-xs">
                  +{planInfo.limits.max_members_addon} {language === 'bn' ? 'সদস্য (অ্যাড-অন)' : 'members (add-on)'}
                </Badge>
              )}
              {planInfo.limits.sms_quota_addon > 0 && (
                <Badge variant="secondary" className="text-xs">
                  +{planInfo.limits.sms_quota_addon} SMS {language === 'bn' ? '(অ্যাড-অন)' : '(add-on)'}
                </Badge>
              )}
            </div>
          )}
        </div>

        <Separator />

        {/* Features */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">
            {language === 'bn' ? 'প্ল্যান ফিচারস' : 'Plan Features'}
          </h4>
          <div className="grid gap-2">
            {features.highlights.slice(0, 4).map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-1.5 w-1.5 rounded-full bg-success" />
                {language === 'bn' ? feature.bn : feature.en}
              </div>
            ))}
          </div>
        </div>

        {/* Upgrade prompt for lower tiers */}
        {planInfo.plan === 'starter' && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm text-primary mb-2">
              {language === 'bn' 
                ? '💡 স্ট্যান্ডার্ড প্ল্যানে আপগ্রেড করুন অনলাইন পেমেন্ট সক্রিয় করতে!'
                : '💡 Upgrade to Standard to enable online payments!'}
            </p>
            <Button 
              size="sm" 
              variant="outline" 
              className="border-primary text-primary"
              onClick={onRequestUpgrade}
            >
              {language === 'bn' ? 'প্ল্যান দেখুন' : 'View Plans'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
