import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  Clock, 
  XCircle, 
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

interface PaymentStatusBadgeProps {
  status: string;
  showIcon?: boolean;
}

export function PaymentStatusBadge({ status, showIcon = true }: PaymentStatusBadgeProps) {
  switch (status) {
    case 'paid':
      return (
        <Badge className="bg-success/10 text-success hover:bg-success/20 gap-1">
          {showIcon && <CheckCircle2 className="h-3 w-3" />}
          Paid
        </Badge>
      );
    case 'pending':
      return (
        <Badge className="bg-warning/10 text-warning hover:bg-warning/20 gap-1">
          {showIcon && <Clock className="h-3 w-3" />}
          Pending
        </Badge>
      );
    case 'failed':
      return (
        <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/20 gap-1">
          {showIcon && <XCircle className="h-3 w-3" />}
          Failed
        </Badge>
      );
    case 'cancelled':
      return (
        <Badge className="bg-muted text-muted-foreground hover:bg-muted/80 gap-1">
          {showIcon && <AlertTriangle className="h-3 w-3" />}
          Cancelled
        </Badge>
      );
    case 'refunded':
      return (
        <Badge className="bg-info/10 text-info hover:bg-info/20 gap-1">
          {showIcon && <RefreshCw className="h-3 w-3" />}
          Refunded
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="gap-1">
          {status}
        </Badge>
      );
  }
}
