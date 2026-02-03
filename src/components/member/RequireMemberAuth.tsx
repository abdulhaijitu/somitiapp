import { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Users } from 'lucide-react';

interface RequireMemberAuthProps {
  children: ReactNode;
}

export function RequireMemberAuth({ children }: RequireMemberAuthProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    checkMemberAccess();
  }, []);

  const checkMemberAccess = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
        console.log('No session found, redirecting to member login');
        navigate('/member/login');
        return;
      }

      // Check if user has member role (or higher - admin/manager can also access member portal)
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
        console.log('User has no tenant association');
        await supabase.auth.signOut();
        navigate('/member/login');
        return;
      }

      // Allow member, manager, or admin roles
      const allowedRoles = ['member', 'manager', 'admin'];
      if (!allowedRoles.includes(roleData.role)) {
        console.log('User role not allowed for member portal');
        navigate('/member/login');
        return;
      }

      setIsAuthorized(true);
    } catch (error) {
      console.error('Auth check error:', error);
      navigate('/member/login');
    } finally {
      setIsLoading(false);
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          navigate('/member/login');
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
