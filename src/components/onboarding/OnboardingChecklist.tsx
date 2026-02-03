import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTenant } from '@/contexts/TenantContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Check,
  Circle,
  Building2,
  Users,
  CreditCard,
  Bell,
  X,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface ChecklistItem {
  id: string;
  titleEn: string;
  titleBn: string;
  descriptionEn: string;
  descriptionBn: string;
  link: string;
  check: () => Promise<boolean>;
}

export function OnboardingChecklist() {
  const { language } = useLanguage();
  const { tenant } = useTenant();
  const [dismissed, setDismissed] = useState(false);
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());

  // Check if onboarding was dismissed
  useEffect(() => {
    const dismissedKey = `onboarding-dismissed-${tenant?.id}`;
    if (localStorage.getItem(dismissedKey)) {
      setDismissed(true);
    }
  }, [tenant?.id]);

  const checklistItems: ChecklistItem[] = [
    {
      id: 'update-info',
      titleEn: 'Update Organization Info',
      titleBn: 'সমিতির তথ্য আপডেট করুন',
      descriptionEn: 'Add your somiti details and contact information',
      descriptionBn: 'আপনার সমিতির বিস্তারিত এবং যোগাযোগের তথ্য যোগ করুন',
      link: '/dashboard/settings',
      check: async () => {
        // Consider complete if tenant has bangla name
        return !!(tenant?.name_bn);
      }
    },
    {
      id: 'add-members',
      titleEn: 'Add Members',
      titleBn: 'সদস্য যোগ করুন',
      descriptionEn: 'Add at least 5 members to your somiti',
      descriptionBn: 'আপনার সমিতিতে কমপক্ষে ৫ জন সদস্য যোগ করুন',
      link: '/dashboard/members',
      check: async () => {
        if (!tenant?.id) return false;
        const { count } = await supabase
          .from('members')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenant.id);
        return (count || 0) >= 5;
      }
    },
    {
      id: 'record-payment',
      titleEn: 'Record First Payment',
      titleBn: 'প্রথম পেমেন্ট রেকর্ড করুন',
      descriptionEn: 'Record your first member payment or opening balance',
      descriptionBn: 'প্রথম সদস্য পেমেন্ট বা প্রারম্ভিক ব্যালেন্স রেকর্ড করুন',
      link: '/dashboard/payments',
      check: async () => {
        if (!tenant?.id) return false;
        const { count } = await supabase
          .from('payments')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenant.id)
          .eq('status', 'paid');
        return (count || 0) >= 1;
      }
    },
    {
      id: 'post-notice',
      titleEn: 'Post First Notice',
      titleBn: 'প্রথম নোটিশ পোস্ট করুন',
      descriptionEn: 'Create a welcome notice for your members',
      descriptionBn: 'আপনার সদস্যদের জন্য একটি স্বাগত নোটিশ তৈরি করুন',
      link: '/dashboard/notices',
      check: async () => {
        // For now, consider complete if they've visited notices page
        return localStorage.getItem(`notice-posted-${tenant?.id}`) === 'true';
      }
    }
  ];

  // Check completion status
  const { data: checkResults } = useQuery({
    queryKey: ['onboarding-checklist', tenant?.id],
    queryFn: async () => {
      const results: Record<string, boolean> = {};
      for (const item of checklistItems) {
        results[item.id] = await item.check();
      }
      return results;
    },
    enabled: !!tenant?.id && !dismissed,
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  useEffect(() => {
    if (checkResults) {
      setCompletedItems(new Set(
        Object.entries(checkResults)
          .filter(([, completed]) => completed)
          .map(([id]) => id)
      ));
    }
  }, [checkResults]);

  const completedCount = completedItems.size;
  const totalCount = checklistItems.length;
  const progressPercent = (completedCount / totalCount) * 100;
  const isComplete = completedCount === totalCount;

  const handleDismiss = () => {
    localStorage.setItem(`onboarding-dismissed-${tenant?.id}`, 'true');
    setDismissed(true);
  };

  if (dismissed || isComplete) {
    return null;
  }

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">
                {language === 'bn' ? 'শুরু করুন' : 'Get Started'}
              </CardTitle>
              <CardDescription>
                {language === 'bn' 
                  ? 'আপনার সমিতি সেটআপ সম্পূর্ণ করুন'
                  : 'Complete your somiti setup'}
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Progress bar */}
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {language === 'bn' ? 'অগ্রগতি' : 'Progress'}
            </span>
            <span className="font-medium text-primary">
              {completedCount}/{totalCount} {language === 'bn' ? 'সম্পন্ন' : 'completed'}
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-2">
          {checklistItems.map((item) => {
            const isCompleted = completedItems.has(item.id);
            
            return (
              <Link
                key={item.id}
                to={item.link}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-3 transition-all",
                  isCompleted 
                    ? "border-success/30 bg-success/5" 
                    : "border-border bg-background hover:border-primary/50 hover:bg-primary/5"
                )}
              >
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0",
                  isCompleted 
                    ? "bg-success/20 text-success" 
                    : "bg-muted text-muted-foreground"
                )}>
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Circle className="h-4 w-4" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-medium",
                    isCompleted ? "text-success" : "text-foreground"
                  )}>
                    {language === 'bn' ? item.titleBn : item.titleEn}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {language === 'bn' ? item.descriptionBn : item.descriptionEn}
                  </p>
                </div>
                
                {!isCompleted && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                )}
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
