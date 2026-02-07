import { ReactNode, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
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
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (isImpersonating && target?.type === 'member') {
      setIsAuthorized(true);
      setIsLoading(false);
      return;
    }
    checkMemberAccess();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isImpersonating, target]);

  const checkMemberAccess = async () => {
    setHasTimedOut(false);
    setIsLoading(true);

    timeoutRef.current = setTimeout(() => {
      setHasTimedOut(true);
      setIsLoading(false);
    }, AUTH_TIMEOUT_MS);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
        navigate('/member/login');
        return;
      }

      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role, tenant_id')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (roleError) {
        console.error('Role check error:', roleError);
        navigate('/member/login');
        return;
      }

      if (!roleData || !roleData.tenant_id) {
        await supabase.auth.signOut();
        navigate('/member/login');
        return;
      }

      const allowedRoles = ['member', 'manager', 'admin'];
      if (!allowedRoles.includes(roleData.role)) {
        navigate('/member/login');
        return;
      }

      setIsAuthorized(true);
    } catch (error) {
      console.error('Auth check error:', error);
      navigate('/member/login');
    } finally {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event) => {
        if (event === 'SIGNED_OUT') {
          navigate('/member/login');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

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
            <Button onClick={checkMemberAccess} className="gap-2">
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
            <span>Verifying access...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
