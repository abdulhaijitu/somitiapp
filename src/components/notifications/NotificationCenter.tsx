import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTenant } from '@/contexts/TenantContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  CreditCard,
  AlertCircle,
  Clock,
  Info,
  X
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { bn } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  notification_type: string;
  title: string;
  title_bn: string | null;
  message: string;
  message_bn: string | null;
  is_read: boolean;
  created_at: string;
  data: Record<string, unknown>;
}

const notificationIcons: Record<string, typeof Bell> = {
  payment_success: CreditCard,
  payment_failed: AlertCircle,
  payment_reminder: Clock,
  dues_reminder: Clock,
  admin_alert: AlertCircle,
  system_alert: Info,
  otp: Info
};

export function NotificationCenter() {
  const { language } = useLanguage();
  const { userId, tenant } = useTenant();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  // Fetch notifications
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data || []) as Notification[];
    },
    enabled: !!userId,
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    }
  });

  // Mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!userId) return;

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('is_read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    }
  });

  const formatTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), {
        addSuffix: true,
        locale: language === 'bn' ? bn : undefined
      });
    } catch {
      return '';
    }
  };

  const getNotificationContent = (notification: Notification) => {
    const title = language === 'bn' && notification.title_bn 
      ? notification.title_bn 
      : notification.title;
    const message = language === 'bn' && notification.message_bn 
      ? notification.message_bn 
      : notification.message;
    return { title, message };
  };

  const getIcon = (type: string) => {
    const Icon = notificationIcons[type] || Bell;
    return Icon;
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'payment_success':
        return 'text-success';
      case 'payment_failed':
      case 'admin_alert':
        return 'text-destructive';
      case 'dues_reminder':
      case 'payment_reminder':
        return 'text-warning';
      default:
        return 'text-primary';
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
          aria-label={language === 'bn' ? 'নোটিফিকেশন' : 'Notifications'}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent 
        className="w-80 sm:w-96 p-0" 
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">
              {language === 'bn' ? 'নোটিফিকেশন' : 'Notifications'}
            </h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {unreadCount} {language === 'bn' ? 'নতুন' : 'new'}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
              className="text-xs h-7"
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1" />
              {language === 'bn' ? 'সব পড়া হয়েছে' : 'Mark all read'}
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications && notifications.length > 0 ? (
            <div className="divide-y divide-border">
              {notifications.map((notification) => {
                const { title, message } = getNotificationContent(notification);
                const Icon = getIcon(notification.notification_type);
                const iconColor = getIconColor(notification.notification_type);

                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 transition-colors hover:bg-muted/50 cursor-pointer",
                      !notification.is_read && "bg-primary/5"
                    )}
                    onClick={() => {
                      if (!notification.is_read) {
                        markAsReadMutation.mutate(notification.id);
                      }
                    }}
                  >
                    <div className="flex gap-3">
                      <div className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0",
                        notification.notification_type === 'payment_success' && "bg-success/10",
                        notification.notification_type === 'payment_failed' && "bg-destructive/10",
                        notification.notification_type === 'admin_alert' && "bg-destructive/10",
                        notification.notification_type === 'dues_reminder' && "bg-warning/10",
                        notification.notification_type === 'payment_reminder' && "bg-warning/10",
                        !['payment_success', 'payment_failed', 'admin_alert', 'dues_reminder', 'payment_reminder'].includes(notification.notification_type) && "bg-primary/10"
                      )}>
                        <Icon className={cn("h-5 w-5", iconColor)} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn(
                            "text-sm font-medium truncate font-bengali",
                            notification.is_read ? "text-foreground/80" : "text-foreground"
                          )}>
                            {title}
                          </p>
                          {!notification.is_read && (
                            <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className={cn(
                          "text-xs mt-0.5 line-clamp-2 font-bengali",
                          notification.is_read ? "text-muted-foreground/70" : "text-muted-foreground"
                        )}>
                          {message}
                        </p>
                        <p className="text-xs text-muted-foreground/60 mt-1">
                          {formatTime(notification.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                <BellOff className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">
                {language === 'bn' ? 'কোনো নোটিফিকেশন নেই' : 'No notifications'}
              </p>
              <p className="text-xs text-muted-foreground">
                {language === 'bn' 
                  ? 'আপনার সব নোটিফিকেশন এখানে দেখাবে' 
                  : "You're all caught up!"}
              </p>
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
