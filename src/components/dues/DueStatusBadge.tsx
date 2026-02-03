import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';

interface DueStatusBadgeProps {
  status: 'unpaid' | 'partial' | 'paid';
  className?: string;
}

export function DueStatusBadge({ status, className }: DueStatusBadgeProps) {
  const { language } = useLanguage();

  const statusConfig = {
    unpaid: {
      label: language === 'bn' ? 'বকেয়া' : 'Unpaid',
      variant: 'destructive' as const,
    },
    partial: {
      label: language === 'bn' ? 'আংশিক' : 'Partial',
      variant: 'secondary' as const,
    },
    paid: {
      label: language === 'bn' ? 'পরিশোধিত' : 'Paid',
      variant: 'default' as const,
    },
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
