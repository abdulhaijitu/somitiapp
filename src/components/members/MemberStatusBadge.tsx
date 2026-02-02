import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Ban } from 'lucide-react';

interface MemberStatusBadgeProps {
  status: string;
  showIcon?: boolean;
}

export function MemberStatusBadge({ status, showIcon = true }: MemberStatusBadgeProps) {
  switch (status) {
    case 'active':
      return (
        <Badge className="bg-success/10 text-success hover:bg-success/20 gap-1">
          {showIcon && <CheckCircle2 className="h-3 w-3" />}
          Active
        </Badge>
      );
    case 'inactive':
      return (
        <Badge className="bg-muted text-muted-foreground hover:bg-muted/80 gap-1">
          {showIcon && <XCircle className="h-3 w-3" />}
          Inactive
        </Badge>
      );
    case 'suspended':
      return (
        <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/20 gap-1">
          {showIcon && <Ban className="h-3 w-3" />}
          Suspended
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
