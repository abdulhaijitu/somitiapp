import { ReactNode, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { Loader2, Shield, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RequireSuperAdminProps {
  children: ReactNode;
}

const AUTH_TIMEOUT_MS = 15000;

export function RequireSuperAdmin({ children }: RequireSuperAdminProps) {
  const navigate = useNavigate();
  const { isLoading, isAuthenticated, isSuperAdmin, refreshTenantContext } = useTenant();
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const hasRedirected = useRef(false);

  // Timeout guard — only for initial loading
  useEffect(() => {
    if (isLoading && !hasTimedOut) {
      timeoutRef.current = setTimeout(() => {
        setHasTimedOut(true);
      }, AUTH_TIMEOUT_MS);
    }

    if (!isLoading) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isLoading, hasTimedOut]);

  useEffect(() => {
    if (isLoading || hasTimedOut || hasRedirected.current) return;

    if (!isAuthenticated || !isSuperAdmin) {
      hasRedirected.current = true;
      navigate('/super-admin/login');
    }
  }, [isLoading, isAuthenticated, isSuperAdmin, navigate, hasTimedOut]);

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
            <Button variant="outline" onClick={() => navigate('/super-admin/login')}>
              Go to Login
            </Button>
            <Button onClick={() => { setHasTimedOut(false); setIsRetrying(true); hasRedirected.current = false; refreshTenantContext(); }} disabled={isRetrying} className="gap-2">
              {isRetrying ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
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
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive">
            <Shield className="h-7 w-7 text-destructive-foreground" />
          </div>
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Verifying access...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isSuperAdmin) {
    return null;
  }

  return <>{children}</>;
}
