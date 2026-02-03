-- Add address column to tenants table
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS address TEXT;

-- Create RLS policy allowing tenant admins to update their own tenant
CREATE POLICY "Tenant admins can update own tenant"
ON public.tenants
FOR UPDATE
USING (
  id = user_tenant_id(auth.uid()) 
  AND has_tenant_role(auth.uid(), id, 'admin'::app_role)
)
WITH CHECK (
  id = user_tenant_id(auth.uid()) 
  AND has_tenant_role(auth.uid(), id, 'admin'::app_role)
);