import { useLanguage } from '@/contexts/LanguageContext';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { calculateUsagePercentage, getUsageStatus } from '@/lib/plans';

interface UsageMeterProps {
  label: string;
  labelBn: string;
  current: number;
  max: number;
  unit?: string;
  unitBn?: string;
  showPercentage?: boolean;
  className?: string;
}

export function UsageMeter({
  label,
  labelBn,
  current,
  max,
  unit = '',
  unitBn = '',
  showPercentage = true,
  className
}: UsageMeterProps) {
  const { language } = useLanguage();
  const percentage = calculateUsagePercentage(current, max);
  const status = getUsageStatus(percentage);
  const isUnlimited = max === 999999;

  const displayLabel = language === 'bn' ? labelBn : label;
  const displayUnit = language === 'bn' ? unitBn : unit;

  const statusColors = {
    success: 'text-success',
    warning: 'text-warning',
    danger: 'text-destructive'
  };

  const progressColors = {
    success: '[&>div]:bg-success',
    warning: '[&>div]:bg-warning',
    danger: '[&>div]:bg-destructive'
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{displayLabel}</span>
        <span className={cn('font-medium', statusColors[status])}>
          {current.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}
          {!isUnlimited && (
            <>
              /{max.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}
            </>
          )}
          {displayUnit && ` ${displayUnit}`}
          {isUnlimited && (
            <span className="ml-1 text-success">
              {language === 'bn' ? '(আনলিমিটেড)' : '(Unlimited)'}
            </span>
          )}
        </span>
      </div>
      {!isUnlimited && (
        <Progress 
          value={percentage} 
          className={cn('h-2', progressColors[status])} 
        />
      )}
      {showPercentage && !isUnlimited && (
        <p className="text-xs text-muted-foreground text-right">
          {percentage}% {language === 'bn' ? 'ব্যবহৃত' : 'used'}
        </p>
      )}
    </div>
  );
}
