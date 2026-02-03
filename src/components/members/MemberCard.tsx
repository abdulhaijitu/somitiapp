import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MoreHorizontal, Phone, User, Wallet } from 'lucide-react';
import { MemberStatusBadge } from '@/components/members/MemberStatusBadge';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Member {
  id: string;
  name: string;
  name_bn: string | null;
  phone: string | null;
  email: string | null;
  status: string;
  joined_at: string | null;
  created_at: string;
  total_paid?: number;
  dues?: number;
}

interface MemberCardProps {
  member: Member;
  language: 'en' | 'bn';
  advanceBalance: number;
  onCardClick: () => void;
  dropdownContent: React.ReactNode;
}

export const MemberCard = memo(function MemberCard({ 
  member, 
  language, 
  advanceBalance,
  onCardClick,
  dropdownContent 
}: MemberCardProps) {
  return (
    <Card 
      className="overflow-hidden transition-all duration-200 active:scale-[0.98] hover:shadow-md cursor-pointer"
      onClick={onCardClick}
    >
      <CardContent className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className={cn(
                "font-semibold text-foreground truncate",
                language === 'bn' && member.name_bn ? 'font-bengali' : ''
              )}>
                {language === 'bn' && member.name_bn ? member.name_bn : member.name}
              </p>
              {member.phone && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {member.phone}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
            <MemberStatusBadge status={member.status} />
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
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              {language === 'bn' ? 'পরিশোধিত' : 'Paid'}
            </p>
            <p className="font-medium text-sm">
              ৳{(member.total_paid || 0).toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              {language === 'bn' ? 'বকেয়া' : 'Dues'}
            </p>
            <p className={cn(
              "font-medium text-sm",
              (member.dues || 0) > 0 ? 'text-destructive' : 'text-muted-foreground'
            )}>
              ৳{(member.dues || 0).toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              {language === 'bn' ? 'অগ্রিম' : 'Advance'}
            </p>
            {advanceBalance > 0 ? (
              <Badge className="bg-primary/10 text-primary border-primary/30 text-xs h-5 gap-0.5">
                <Wallet className="h-2.5 w-2.5" />
                ৳{advanceBalance.toLocaleString()}
              </Badge>
            ) : (
              <p className="text-muted-foreground text-sm">-</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-2 pt-2 text-xs text-muted-foreground text-center">
          {language === 'bn' ? 'যোগদান:' : 'Joined:'} {format(new Date(member.joined_at || member.created_at), 'MMM d, yyyy')}
        </div>
      </CardContent>
    </Card>
  );
});
