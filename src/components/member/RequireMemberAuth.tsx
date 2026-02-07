import { ReactNode, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { Loader2, Users, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RequireMemberAuthProps {
  children: ReactNode;
}

const AUTH_TIMEOUT_MS = 10000;

type AuthGuardState = 'loading' | 'authenticated' | 'unauthenticated' | 'timeout';

export function RequireMemberAuth({ children }: RequireMemberAuthProps) {
  const navigate = useNavigate();
  const { isImpersonating, target } = useImpersonation();
  const { isLoading, isAuthenticated, isMember, refreshTenantContext } = useTenant();
  const [guardState, setGuardState] = useState<AuthGuardState>('loading');
  const [isRetrying, setIsRetrying] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const hasRedirected = useRef(false);

  // Determine guard state from context — strict state machine
  useEffect(() => {
    if (isLoading) {
      if (guardState !== 'timeout') {
        setGuardState('loading');
      }
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
    setIsRetrying(false);

    if (isImpersonating && target?.type === 'member') {
      setGuardState('authenticated');
    } else if (isAuthenticated && isMember) {
      setGuardState('authenticated');
    } else {
      setGuardState('unauthenticated');
    }
  }, [isLoading, isAuthenticated, isMember, isImpersonating, target]);

  // Timeout guard
  useEffect(() => {
    if (guardState === 'loading') {
      timeoutRef.current = setTimeout(() => {
        setGuardState('timeout');
      }, AUTH_TIMEOUT_MS);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = undefined;
      }
    };
  }, [guardState]);

  // Redirect on unauthenticated
  useEffect(() => {
    if (guardState === 'unauthenticated' && !hasRedirected.current) {
      hasRedirected.current = true;
      navigate('/member/login');
    }
  }, [guardState, navigate]);

  const handleRetry = () => {
    setIsRetrying(true);
    hasRedirected.current = false;
    setGuardState('loading');
    refreshTenantContext({ withLoading: true });
  };

  const handleGoToLogin = () => {
    hasRedirected.current = true;
    navigate('/member/login');
  };

  if (guardState === 'timeout') {
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
            <Button variant="outline" onClick={handleGoToLogin}>
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

  if (guardState === 'loading') {
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

  if (guardState === 'authenticated') {
    return <>{children}</>;
  }

  return null;
}
