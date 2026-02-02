-- Drop the overly permissive policy
DROP POLICY IF EXISTS "System can insert payment logs" ON public.payment_logs;

-- Create a more restrictive policy - only allow inserts for users in the tenant
CREATE POLICY "Users in tenant can insert payment logs"
ON public.payment_logs
FOR INSERT
WITH CHECK (
  is_super_admin(auth.uid()) OR
  tenant_id = user_tenant_id(auth.uid())
);