import { AlertCircle, Clock, XCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useTenant } from '@/contexts/TenantContext';

interface SubscriptionBannerProps {
  onRenew?: () => void;
}

export function SubscriptionBanner({ onRenew }: SubscriptionBannerProps) {
  const { 
    subscription, 
    isSubscriptionValid, 
    isSubscriptionExpiringSoon, 
    subscriptionDaysRemaining,
    tenant,
    error 
  } = useTenant();

  // Show tenant error/suspension banner
  if (error && tenant?.status === 'suspended') {
    return (
      <Alert variant="destructive" className="rounded-none border-x-0 border-t-0">
        <XCircle className="h-4 w-4" />
        <AlertTitle>Organization Suspended</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>Your organization has been suspended. Please contact support for assistance.</span>
          <Button variant="outline" size="sm" className="ml-4">
            Contact Support
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Show subscription expired banner
  if (subscription && !isSubscriptionValid) {
    return (
      <Alert variant="destructive" className="rounded-none border-x-0 border-t-0">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Subscription Expired</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>
            Your subscription has expired. Some features are now restricted. 
            Please renew to restore full access.
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-4 bg-background"
            onClick={onRenew}
          >
            Renew Now
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Show subscription expiring soon warning
  if (isSubscriptionExpiringSoon) {
    return (
      <Alert className="rounded-none border-x-0 border-t-0 border-warning bg-warning/10">
        <Clock className="h-4 w-4 text-warning" />
        <AlertTitle className="text-warning">Subscription Expiring Soon</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span className="text-warning/90">
            Your subscription expires in {subscriptionDaysRemaining} day{subscriptionDaysRemaining !== 1 ? 's' : ''}. 
            Renew now to avoid service interruption.
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-4 border-warning text-warning hover:bg-warning/20"
            onClick={onRenew}
          >
            Renew Now
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
