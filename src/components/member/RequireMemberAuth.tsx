import { ReactNode, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { Loader2, Users, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RequireMemberAuthProps {
  children: ReactNode;
}

const AUTH_TIMEOUT_MS = 15000;

export function RequireMemberAuth({ children }: RequireMemberAuthProps) {
  const navigate = useNavigate();
  const { isImpersonating, target } = useImpersonation();
  const { isLoading, isAuthenticated, isMember, refreshTenantContext } = useTenant();
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (isLoading) {
      setHasTimedOut(false);
      hasRedirected.current = false;
      timeoutRef.current = setTimeout(() => {
        setHasTimedOut(true);
      }, AUTH_TIMEOUT_MS);
    } else {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isLoading]);

  useEffect(() => {
    if (isLoading || hasTimedOut || hasRedirected.current) return;
    if (isImpersonating && target?.type === 'member') return;

    if (!isAuthenticated || !isMember) {
      hasRedirected.current = true;
      navigate('/member/login');
    }
  }, [isLoading, isAuthenticated, isMember, isImpersonating, target, navigate, hasTimedOut]);

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
            <Button variant="outline" onClick={() => navigate('/member/login')}>
              Go to Login
            </Button>
            <Button onClick={() => { setHasTimedOut(false); refreshTenantContext(); }} className="gap-2">
              <RefreshCw className="h-4 w-4" />
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
            <Users className="h-7 w-7 text-primary" />
          </div>
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading your portal...</span>
          </div>
        </div>
      </div>
    );
  }

  if (isImpersonating && target?.type === 'member') {
    return <>{children}</>;
  }

  if (!isAuthenticated || !isMember) {
    return null;
  }

  return <>{children}</>;
}
