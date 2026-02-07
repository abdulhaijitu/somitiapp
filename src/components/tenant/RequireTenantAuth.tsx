import { ReactNode, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { Loader2, Building2, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RequireTenantAuthProps {
  children: ReactNode;
}

const AUTH_TIMEOUT_MS = 10000;

export function RequireTenantAuth({ children }: RequireTenantAuthProps) {
  const navigate = useNavigate();
  const { isImpersonating, target } = useImpersonation();
  const { isLoading, isAuthenticated, isAdmin, isManager, error, refreshTenantContext } = useTenant();
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const hasRedirected = useRef(false);

  // Timeout guard — only for initial loading, resets properly
  useEffect(() => {
    if (isLoading && !hasTimedOut) {
      timeoutRef.current = setTimeout(() => {
        setHasTimedOut(true);
      }, AUTH_TIMEOUT_MS);
    }

    if (!isLoading) {
      // Loading finished — clear any pending timeout
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setIsRetrying(false);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isLoading, hasTimedOut]);

  // Redirect if not authorized (after loading completes)
  useEffect(() => {
    if (isLoading || hasTimedOut || hasRedirected.current) return;
    
    // If impersonating as tenant admin, skip checks
    if (isImpersonating && target?.type === 'tenant_admin') return;

    if (!isAuthenticated) {
      hasRedirected.current = true;
      navigate('/login');
    } else if (!isAdmin && !isManager) {
      hasRedirected.current = true;
      navigate('/login');
    }
  }, [isLoading, isAuthenticated, isAdmin, isManager, isImpersonating, target, navigate, hasTimedOut]);

  const handleRetry = () => {
    setHasTimedOut(false);
    setIsRetrying(true);
    hasRedirected.current = false;
    refreshTenantContext();
  };

  if (hasTimedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-sm px-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-warning/10">
            <AlertTriangle className="h-7 w-7 text-warning" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Connection Timeout</h3>
          <p className="text-sm text-muted-foreground">
            Verification is taking too long. Please check your internet connection and try again.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate('/login')}>
              Go to Login
            </Button>
            <Button onClick={handleRetry} disabled={isRetrying} className="gap-2">
              {isRetrying ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Building2 className="h-7 w-7 text-primary" />
          </div>
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading your dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  // If impersonating, allow through
  if (isImpersonating && target?.type === 'tenant_admin') {
    return <>{children}</>;
  }

  if (!isAuthenticated || (!isAdmin && !isManager)) {
    return null;
  }

  return <>{children}</>;
}
