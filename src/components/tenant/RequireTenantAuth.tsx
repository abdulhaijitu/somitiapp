import { ReactNode, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { Loader2, Building2, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RequireTenantAuthProps {
  children: ReactNode;
}

const AUTH_TIMEOUT_MS = 15000; // 15 second timeout

export function RequireTenantAuth({ children }: RequireTenantAuthProps) {
  const navigate = useNavigate();
  const { isImpersonating, target } = useImpersonation();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    // If impersonating as tenant admin, bypass auth check
    if (isImpersonating && target?.type === 'tenant_admin') {
      setIsAuthorized(true);
      setIsLoading(false);
      return;
    }
    checkTenantAccess();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isImpersonating, target]);

  const checkTenantAccess = async () => {
    setHasTimedOut(false);
    setIsLoading(true);

    // Set timeout guard
    timeoutRef.current = setTimeout(() => {
      setHasTimedOut(true);
      setIsLoading(false);
    }, AUTH_TIMEOUT_MS);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
        console.log('No session found, redirecting to login');
        navigate('/login');
        return;
      }

      // Check if user has admin or manager role for a tenant
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role, tenant_id')
        .eq('user_id', session.user.id)
        .in('role', ['admin', 'manager'])
        .maybeSingle();

      if (roleError) {
        console.error('Role check error:', roleError);
        navigate('/login');
        return;
      }

      if (!roleData || !roleData.tenant_id) {
        console.log('User is not a tenant admin/manager');
        await supabase.auth.signOut();
        navigate('/login');
        return;
      }

      setIsAuthorized(true);
    } catch (error) {
      console.error('Auth check error:', error);
      navigate('/login');
    } finally {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setIsLoading(false);
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          navigate('/login');
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
            <Button variant="outline" onClick={() => navigate('/login')}>
              Go to Login
            </Button>
            <Button onClick={checkTenantAccess} className="gap-2">
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
            <Building2 className="h-7 w-7 text-primary" />
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
