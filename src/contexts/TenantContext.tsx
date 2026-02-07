import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useImpersonation } from '@/contexts/ImpersonationContext';

export interface Tenant {
  id: string;
  name: string;
  name_bn: string | null;
  subdomain: string;
  status: string;
  default_language: string;
}

export interface Subscription {
  id: string;
  plan: string;
  status: string;
  start_date: string;
  end_date: string;
}

export interface UserRole {
  role: string;
  tenant_id: string | null;
}

export interface TenantContextValue {
  tenant: Tenant | null;
  subscription: Subscription | null;
  userRoles: UserRole[];
  userId: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isMember: boolean;
  isSubscriptionValid: boolean;
  isSubscriptionExpiringSoon: boolean;
  subscriptionDaysRemaining: number;
  error: string | null;
  refreshTenantContext: () => Promise<void>;
  checkPermission: (requiredRole: string | string[]) => boolean;
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { isImpersonating, target: impersonationTarget } = useImpersonation();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Computed properties
  const isAuthenticated = !!userId;
  const isSuperAdmin = userRoles.some(r => r.role === 'super_admin');
  const isAdmin = isSuperAdmin || userRoles.some(r => r.role === 'admin');
  const isManager = isAdmin || userRoles.some(r => r.role === 'manager');
  const isMember = isManager || userRoles.some(r => r.role === 'member');

  // Subscription validity
  const isSubscriptionValid = subscription?.status === 'active' && 
    new Date(subscription.end_date) > new Date();
  
  const subscriptionDaysRemaining = subscription 
    ? Math.max(0, Math.ceil((new Date(subscription.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;
  
  const isSubscriptionExpiringSoon = subscriptionDaysRemaining > 0 && subscriptionDaysRemaining <= 7;

  const checkPermission = useCallback((requiredRole: string | string[]): boolean => {
    if (isSuperAdmin) return true;
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    return userRoles.some(ur => roles.includes(ur.role));
  }, [userRoles, isSuperAdmin]);

  const loadTenantContext = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get current user session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        setError('Failed to verify authentication');
        return;
      }

      if (!session?.user) {
        // Not authenticated - this is not an error
        setUserId(null);
        setUserRoles([]);
        setTenant(null);
        setSubscription(null);
        return;
      }

      setUserId(session.user.id);

      // Fetch user roles (server-side source of truth)
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role, tenant_id')
        .eq('user_id', session.user.id);

      if (rolesError) {
        console.error('Roles fetch error:', rolesError);
        setError('Failed to load user permissions');
        return;
      }

      setUserRoles(roles || []);

      // Check if super admin
      const isSuperAdminUser = roles?.some(r => r.role === 'super_admin');
      
      // If super admin is impersonating a tenant, use impersonation target
      if (isSuperAdminUser && isImpersonating && impersonationTarget?.tenantId) {
        // Load impersonated tenant data
        const { data: impersonatedTenant, error: impTenantError } = await supabase
          .from('tenants')
          .select('*')
          .eq('id', impersonationTarget.tenantId)
          .maybeSingle();

        if (impTenantError || !impersonatedTenant) {
          console.error('Impersonated tenant fetch error:', impTenantError);
          setError('Failed to load impersonated organization');
          return;
        }

        setTenant(impersonatedTenant);

        // Fetch subscription for impersonated tenant
        const { data: impSubData } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('tenant_id', impersonationTarget.tenantId)
          .maybeSingle();

        setSubscription(impSubData);
        return;
      }
      
      if (isSuperAdminUser) {
        // Super admin doesn't need tenant context when not impersonating
        setTenant(null);
        setSubscription(null);
        return;
      }

      // Get tenant from user roles (server-resolved, not client)
      const tenantRole = roles?.find(r => r.tenant_id);
      
      if (!tenantRole?.tenant_id) {
        // No tenant association - might be new user or issue
        setTenant(null);
        setSubscription(null);
        return;
      }

      // Fetch tenant details
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', tenantRole.tenant_id)
        .maybeSingle();

      if (tenantError) {
        console.error('Tenant fetch error:', tenantError);
        setError('Failed to load organization data');
        return;
      }

      if (!tenantData) {
        setError('Organization not found');
        return;
      }

      // Check tenant status
      if (tenantData.status === 'suspended') {
        setError('Your organization has been suspended. Please contact support.');
        setTenant(tenantData);
        return;
      }

      if (tenantData.status === 'deleted') {
        setError('Your organization is no longer active.');
        return;
      }

      setTenant(tenantData);

      // Fetch subscription
      const { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('tenant_id', tenantRole.tenant_id)
        .maybeSingle();

      if (subError && subError.code !== 'PGRST116') {
        console.error('Subscription fetch error:', subError);
      }

      setSubscription(subData);

      // Show subscription warning if expiring soon
      if (subData && subscriptionDaysRemaining <= 7 && subscriptionDaysRemaining > 0) {
        toast({
          title: 'Subscription Expiring Soon',
          description: `Your subscription expires in ${subscriptionDaysRemaining} days. Please renew to avoid service interruption.`,
          variant: 'default'
        });
      }

    } catch (err) {
      console.error('TenantContext error:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [toast, subscriptionDaysRemaining, isImpersonating, impersonationTarget]);

  const refreshTenantContext = useCallback(async () => {
    await loadTenantContext();
  }, [loadTenantContext]);

  // Initial load and reload when impersonation changes
  useEffect(() => {
    loadTenantContext();
  }, [loadTenantContext, isImpersonating, impersonationTarget?.tenantId]);

  // Listen for auth changes - skip redundant reloads on TOKEN_REFRESHED
  useEffect(() => {
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN') {
          await loadTenantContext();
        } else if (event === 'TOKEN_REFRESHED') {
          // Token refresh doesn't need a full reload if we already have data
          if (!userId && session?.user) {
            await loadTenantContext();
          }
        } else if (event === 'SIGNED_OUT') {
          setUserId(null);
          setUserRoles([]);
          setTenant(null);
          setSubscription(null);
          setError(null);
        }
      }
    );

    return () => {
      authSub.unsubscribe();
    };
  }, [loadTenantContext, userId]);

  // Re-validate session when tab becomes visible again (prevents stuck loading)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && userId) {
        // Quick session check - only reload if session is gone
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setUserId(null);
          setUserRoles([]);
          setTenant(null);
          setSubscription(null);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [userId]);

  const value: TenantContextValue = {
    tenant,
    subscription,
    userRoles,
    userId,
    isLoading,
    isAuthenticated,
    isSuperAdmin,
    isAdmin,
    isManager,
    isMember,
    isSubscriptionValid,
    isSubscriptionExpiringSoon,
    subscriptionDaysRemaining,
    error,
    refreshTenantContext,
    checkPermission
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}
