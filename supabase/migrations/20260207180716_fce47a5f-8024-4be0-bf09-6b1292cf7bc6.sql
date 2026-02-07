
-- Fix #1: Remove overly permissive public SELECT on subscriptions
DROP POLICY IF EXISTS "Public can view subscriptions for demo" ON public.subscriptions;

CREATE POLICY "Tenant users can view their subscription"
ON public.subscriptions
FOR SELECT
USING (
  is_super_admin(auth.uid())
  OR tenant_id = user_tenant_id(auth.uid())
);

-- Fix #2: Remove overly permissive public SELECT on tenants (keep tenant user + super admin + unauthenticated subdomain lookup via DB function)
DROP POLICY IF EXISTS "Public can view tenants for demo" ON public.tenants;

-- Unauthenticated users can only look up tenants via the security definer function get_tenant_by_subdomain
-- Authenticated users see their own tenant or super admins see all
CREATE POLICY "Authenticated users can view relevant tenants"
ON public.tenants
FOR SELECT
USING (
  is_super_admin(auth.uid())
  OR id = user_tenant_id(auth.uid())
);
