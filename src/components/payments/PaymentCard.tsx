import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MoreHorizontal, CreditCard, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PaymentStatusBadge } from '@/components/payments/PaymentStatusBadge';
import { PaymentMethodBadge } from '@/components/payments/PaymentMethodBadge';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PaymentMember {
  id: string;
  name: string;
  name_bn: string | null;
}

interface PaymentCardProps {
  payment: {
    id: string;
    amount: number;
    status: string;
    payment_method: string;
    payment_date: string | null;
    created_at: string;
    period_month: number | null;
    period_year: number | null;
    reference: string | null;
    members: PaymentMember | null;
    metadata?: {
      member_requested?: boolean;
      admin_approved?: boolean;
    } | null;
  };
  language: 'en' | 'bn';
  onCardClick?: () => void;
  dropdownContent?: React.ReactNode;
  showApprovalBadge?: boolean;
}

export const PaymentCard = memo(function PaymentCard({ 
  payment, 
  language,
  onCardClick,
  dropdownContent,
  showApprovalBadge = false
}: PaymentCardProps) {
  const memberName = payment.members 
    ? (language === 'bn' && payment.members.name_bn 
      ? payment.members.name_bn 
      : payment.members.name)
    : (language === 'bn' ? 'অজানা' : 'Unknown');

  const needsApproval = payment.metadata?.member_requested && !payment.metadata?.admin_approved;

  const getMonthName = (month: number) => {
    const months = language === 'bn' 
      ? ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর']
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month - 1] || '';
  };

  return (
    <Card 
      className={cn(
        "overflow-hidden transition-all duration-200",
        onCardClick && "active:scale-[0.98] hover:shadow-md cursor-pointer",
        needsApproval && showApprovalBadge && "border-warning/50 bg-warning/5"
      )}
      onClick={onCardClick}
    >
      <CardContent className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
              payment.status === 'paid' ? 'bg-success/10' : 'bg-muted'
            )}>
              <CreditCard className={cn(
                "h-5 w-5",
                payment.status === 'paid' ? 'text-success' : 'text-muted-foreground'
              )} />
            </div>
            <div className="min-w-0">
              <p className={cn(
                "font-semibold text-foreground truncate",
                language === 'bn' ? 'font-bengali' : ''
              )}>
                {memberName}
              </p>
              {payment.period_month && payment.period_year && (
                <p className="text-sm text-muted-foreground">
                  {getMonthName(payment.period_month)} {payment.period_year}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
            <PaymentStatusBadge status={payment.status} />
            {dropdownContent && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="z-50">
                  {dropdownContent}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Approval badge */}
        {needsApproval && showApprovalBadge && (
          <div className="mb-3">
            <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
              {language === 'bn' ? 'অনুমোদন প্রয়োজন' : 'Needs Approval'}
            </Badge>
          </div>
        )}

        {/* Amount and method */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div>
            <p className="text-2xl font-bold text-foreground">
              ৳{Number(payment.amount).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {format(new Date(payment.payment_date || payment.created_at), 'MMM d, yyyy')}
            </p>
          </div>
          <PaymentMethodBadge method={payment.payment_method} />
        </div>

        {/* Reference if exists */}
        {payment.reference && (
          <div className="mt-2 pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Ref: <span className="font-mono">{payment.reference}</span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
