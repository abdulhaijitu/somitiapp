import { Badge } from '@/components/ui/badge';
import { Wallet, Smartphone } from 'lucide-react';

interface PaymentMethodBadgeProps {
  method: string;
  type?: string;
}

const methodConfig: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  bkash: {
    label: 'bKash',
    icon: <Smartphone className="h-3 w-3" />,
    className: 'bg-pink-500/10 text-pink-600 hover:bg-pink-500/20'
  },
  nagad: {
    label: 'Nagad',
    icon: <Smartphone className="h-3 w-3" />,
    className: 'bg-orange-500/10 text-orange-600 hover:bg-orange-500/20'
  },
  rocket: {
    label: 'Rocket',
    icon: <Smartphone className="h-3 w-3" />,
    className: 'bg-purple-500/10 text-purple-600 hover:bg-purple-500/20'
  },
  card: {
    label: 'Card',
    icon: <Smartphone className="h-3 w-3" />,
    className: 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20'
  },
  offline: {
    label: 'Cash',
    icon: <Wallet className="h-3 w-3" />,
    className: 'bg-muted text-muted-foreground hover:bg-muted/80'
  },
  other: {
    label: 'Online',
    icon: <Smartphone className="h-3 w-3" />,
    className: 'bg-info/10 text-info hover:bg-info/20'
  }
};

export function PaymentMethodBadge({ method, type }: PaymentMethodBadgeProps) {
  const config = methodConfig[method?.toLowerCase()] || methodConfig.other;
  
  // If it's offline type, show cash regardless of method
  if (type === 'offline') {
    const offlineConfig = methodConfig.offline;
    return (
      <Badge className={`gap-1 ${offlineConfig.className}`}>
        {offlineConfig.icon}
        {offlineConfig.label}
      </Badge>
    );
  }

  return (
    <Badge className={`gap-1 ${config.className}`}>
      {config.icon}
      {config.label}
    </Badge>
  );
}
