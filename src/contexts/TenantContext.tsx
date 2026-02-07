import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef, useMemo } from 'react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
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
  const mountedRef = useRef(true);
  const initialLoadDoneRef = useRef(false);
  const dataLoadedRef = useRef(false);

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

  const clearState = useCallback(() => {
    setUserId(null);
    setUserRoles([]);
    setTenant(null);
    setSubscription(null);
    setError(null);
  }, []);

  // Core function: load tenant data for a given user ID
  const loadUserData = useCallback(async (currentUserId: string) => {
    if (!mountedRef.current) return;
    
    try {
      setError(null);

      // Fetch user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role, tenant_id')
        .eq('user_id', currentUserId);

      if (!mountedRef.current) return;

      if (rolesError) {
        console.error('Roles fetch error:', rolesError);
        setError('Failed to load user permissions');
        return;
      }

      setUserRoles(roles || []);

      const isSuperAdminUser = roles?.some(r => r.role === 'super_admin');
      
      // If super admin is impersonating a tenant
      if (isSuperAdminUser && isImpersonating && impersonationTarget?.tenantId) {
        const { data: impersonatedTenant, error: impTenantError } = await supabase
          .from('tenants')
          .select('*')
          .eq('id', impersonationTarget.tenantId)
          .maybeSingle();

        if (!mountedRef.current) return;

        if (impTenantError || !impersonatedTenant) {
          console.error('Impersonated tenant fetch error:', impTenantError);
          setError('Failed to load impersonated organization');
          return;
        }

        setTenant(impersonatedTenant);

        const { data: impSubData } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('tenant_id', impersonationTarget.tenantId)
          .maybeSingle();

        if (mountedRef.current) setSubscription(impSubData);
        return;
      }
      
      if (isSuperAdminUser) {
        setTenant(null);
        setSubscription(null);
        return;
      }

      // Get tenant from user roles
      const tenantRole = roles?.find(r => r.tenant_id);
      
      if (!tenantRole?.tenant_id) {
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

      if (!mountedRef.current) return;

      if (tenantError) {
        console.error('Tenant fetch error:', tenantError);
        setError('Failed to load organization data');
        return;
      }

      if (!tenantData) {
        setError('Organization not found');
        return;
      }

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

      if (!mountedRef.current) return;

      if (subError && subError.code !== 'PGRST116') {
        console.error('Subscription fetch error:', subError);
      }

      setSubscription(subData);

    } catch (err) {
      console.error('loadUserData error:', err);
      if (mountedRef.current) setError('An unexpected error occurred');
    }
  }, [isImpersonating, impersonationTarget]);

  // Single auth listener — the ONLY source of truth for auth state
  useEffect(() => {
    mountedRef.current = true;
    const userIdRef = { current: userId };

    const handleAuthChange = async (event: AuthChangeEvent, session: Session | null) => {
      if (!mountedRef.current) return;

      console.log('[TenantContext] Auth event:', event, !!session?.user, 'initialDone:', initialLoadDoneRef.current);

      if (event === 'INITIAL_SESSION') {
        if (session?.user) {
          setUserId(session.user.id);
          userIdRef.current = session.user.id;
          if (!initialLoadDoneRef.current) setIsLoading(true);
          await loadUserData(session.user.id);
          if (mountedRef.current) {
            initialLoadDoneRef.current = true;
            dataLoadedRef.current = true;
            setIsLoading(false);
          }
        } else {
          clearState();
          initialLoadDoneRef.current = true;
          setIsLoading(false);
        }
      } else if (event === 'SIGNED_IN') {
        if (session?.user) {
          const isNewUser = session.user.id !== userIdRef.current;
          setUserId(session.user.id);
          userIdRef.current = session.user.id;
          // Always load on fresh sign-in or if data wasn't loaded
          if (isNewUser || !dataLoadedRef.current) {
            setIsLoading(true);
            await loadUserData(session.user.id);
            if (mountedRef.current) {
              initialLoadDoneRef.current = true;
              dataLoadedRef.current = true;
              setIsLoading(false);
            }
          }
        }
      } else if (event === 'TOKEN_REFRESHED') {
        // Silent — never show loading, never reload if user already loaded
        if (session?.user) {
          userIdRef.current = session.user.id;
        }
      } else if (event === 'SIGNED_OUT') {
        userIdRef.current = null;
        initialLoadDoneRef.current = false;
        clearState();
        setIsLoading(false);
      }
    };

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(handleAuthChange);

    return () => {
      mountedRef.current = false;
      authSub.unsubscribe();
    };
  }, [loadUserData, clearState]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reload when impersonation changes (for super admin)
  useEffect(() => {
    if (userId && isImpersonating) {
      setIsLoading(true);
      loadUserData(userId).finally(() => {
        if (mountedRef.current) setIsLoading(false);
      });
    }
  }, [isImpersonating, impersonationTarget?.tenantId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Refresh function for manual use — silent (no global loader) since data is already cached
  const refreshTenantContext = useCallback(async () => {
    if (!userId) return;
    // Don't set isLoading — this prevents timeout guards from triggering on manual refresh
    await loadUserData(userId);
  }, [userId, loadUserData]);

  // Show subscription warning toast
  useEffect(() => {
    if (subscription && subscriptionDaysRemaining <= 7 && subscriptionDaysRemaining > 0) {
      toast({
        title: 'Subscription Expiring Soon',
        description: `Your subscription expires in ${subscriptionDaysRemaining} days. Please renew to avoid service interruption.`,
        variant: 'default'
      });
    }
  }, [subscription?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // No visibilitychange handler needed — Supabase auth handles session lifecycle.
  // The old handler caused race conditions on tab return.

  const value = useMemo<TenantContextValue>(() => ({
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
  }), [
    tenant, subscription, userRoles, userId, isLoading,
    isAuthenticated, isSuperAdmin, isAdmin, isManager, isMember,
    isSubscriptionValid, isSubscriptionExpiringSoon, subscriptionDaysRemaining,
    error, refreshTenantContext, checkPermission
  ]);

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
