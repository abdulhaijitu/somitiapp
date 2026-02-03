import { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Shield } from 'lucide-react';

interface RequireSuperAdminProps {
  children: ReactNode;
}

export function RequireSuperAdmin({ children }: RequireSuperAdminProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    checkSuperAdminAccess();
  }, []);

  const checkSuperAdminAccess = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
        console.log('No session found, redirecting to login');
        navigate('/super-admin/login');
        return;
      }

      // Check if user has super_admin role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'super_admin')
        .maybeSingle();

      if (roleError) {
        console.error('Role check error:', roleError);
        navigate('/super-admin/login');
        return;
      }

      if (!roleData) {
        console.log('User is not a super admin');
        await supabase.auth.signOut();
        navigate('/super-admin/login');
        return;
      }

      setIsAuthorized(true);
    } catch (error) {
      console.error('Auth check error:', error);
      navigate('/super-admin/login');
    } finally {
      setIsLoading(false);
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          navigate('/super-admin/login');
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

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
