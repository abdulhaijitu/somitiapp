import { ReactNode } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { ShieldX } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PermissionGateProps {
  children: ReactNode;
  requiredRole?: string | string[];
  requireSubscription?: boolean;
  fallback?: ReactNode;
  showAccessDenied?: boolean;
}

export function PermissionGate({
  children,
  requiredRole,
  requireSubscription = false,
  fallback,
  showAccessDenied = true
}: PermissionGateProps) {
  const { 
    isLoading, 
    isAuthenticated, 
    checkPermission, 
    isSubscriptionValid,
    isSuperAdmin 
  } = useTenant();

  // Still loading
  if (isLoading) {
    return null;
  }

  // Not authenticated
  if (!isAuthenticated) {
    if (fallback) return <>{fallback}</>;
    if (!showAccessDenied) return null;
    
    return (
      <AccessDeniedCard 
        title="Authentication Required" 
        description="Please sign in to access this feature."
      />
    );
  }

  // Check role permission
  if (requiredRole && !isSuperAdmin) {
    const hasPermission = checkPermission(requiredRole);
    if (!hasPermission) {
      if (fallback) return <>{fallback}</>;
      if (!showAccessDenied) return null;
      
      return (
        <AccessDeniedCard 
          title="Access Denied" 
          description="You don't have permission to access this feature. Contact your administrator for access."
        />
      );
    }
  }

  // Check subscription (super admins bypass)
  if (requireSubscription && !isSuperAdmin && !isSubscriptionValid) {
    if (fallback) return <>{fallback}</>;
    if (!showAccessDenied) return null;
    
    return (
      <AccessDeniedCard 
        title="Subscription Required" 
        description="This feature requires an active subscription. Please renew your subscription to continue."
      />
    );
  }

  return <>{children}</>;
}

function AccessDeniedCard({ title, description }: { title: string; description: string }) {
  return (
    <Card className="border-border max-w-md mx-auto mt-8">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <ShieldX className="h-7 w-7 text-muted-foreground" />
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}

// Hook for programmatic permission checks
export function usePermission(requiredRole?: string | string[]) {
  const { checkPermission, isAuthenticated, isSubscriptionValid, isSuperAdmin, isLoading } = useTenant();
  
  const hasPermission = !requiredRole || isSuperAdmin || checkPermission(requiredRole);
  
  return {
    hasPermission,
    isAuthenticated,
    isSubscriptionValid,
    isSuperAdmin,
    isLoading
  };
}
