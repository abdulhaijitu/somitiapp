import { useLanguage } from '@/contexts/LanguageContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowUpRight, Lock } from 'lucide-react';
import { LimitCheckResult, needsUpgrade } from '@/lib/plans';
import { Link } from 'react-router-dom';

interface PlanLimitAlertProps {
  result: LimitCheckResult;
  onUpgradeClick?: () => void;
  showUpgradeButton?: boolean;
}

export function PlanLimitAlert({ 
  result, 
  onUpgradeClick,
  showUpgradeButton = true 
}: PlanLimitAlertProps) {
  const { language } = useLanguage();

  if (result.allowed) return null;

  const message = language === 'bn' ? result.message_bn : result.message;
  const title = language === 'bn' ? 'সীমা পূর্ণ' : 'Limit Reached';

  return (
    <Alert variant="destructive" className="border-warning/50 bg-warning/10">
      <Lock className="h-4 w-4 text-warning" />
      <AlertTitle className="text-warning">{title}</AlertTitle>
      <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-warning/90">{message}</span>
        {showUpgradeButton && needsUpgrade(result) && (
          <Link to="/dashboard/settings?tab=billing">
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 border-warning text-warning hover:bg-warning/20"
              onClick={onUpgradeClick}
            >
              <ArrowUpRight className="h-4 w-4" />
              {language === 'bn' ? 'আপগ্রেড করুন' : 'Upgrade Plan'}
            </Button>
          </Link>
        )}
      </AlertDescription>
    </Alert>
  );
}
