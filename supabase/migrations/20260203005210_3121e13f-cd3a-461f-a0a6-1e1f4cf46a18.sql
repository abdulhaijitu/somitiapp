-- Allow public read access to tenants for Super Admin UI
-- (since we don't have actual auth in demo mode)
DROP POLICY IF EXISTS "Super admins can view all tenants" ON public.tenants;
CREATE POLICY "Public can view tenants for demo"
  ON public.tenants
  FOR SELECT
  USING (true);

-- Allow public read access to subscriptions for Super Admin UI
DROP POLICY IF EXISTS "Super admins can view all subscriptions" ON public.subscriptions;
CREATE POLICY "Public can view subscriptions for demo"
  ON public.subscriptions
  FOR SELECT
  USING (true);

-- Allow tenant users to also see their own tenant
DROP POLICY IF EXISTS "Tenant users can view own tenant" ON public.tenants;
CREATE POLICY "Tenant users can view own tenant"
  ON public.tenants
  FOR SELECT
  USING (id = user_tenant_id(auth.uid()) OR is_super_admin(auth.uid()) OR auth.uid() IS NULL);