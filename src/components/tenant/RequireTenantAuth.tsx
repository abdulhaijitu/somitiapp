import { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { Loader2, Building2 } from 'lucide-react';

interface RequireTenantAuthProps {
  children: ReactNode;
}

export function RequireTenantAuth({ children }: RequireTenantAuthProps) {
  const navigate = useNavigate();
  const { isImpersonating, target } = useImpersonation();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // If impersonating as tenant admin, bypass auth check
    if (isImpersonating && target?.type === 'tenant_admin') {
      setIsAuthorized(true);
      setIsLoading(false);
      return;
    }
    checkTenantAccess();
  }, [isImpersonating, target]);

  const checkTenantAccess = async () => {
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
