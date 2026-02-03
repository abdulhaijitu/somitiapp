-- Create member_balances table for tracking advance payments
CREATE TABLE public.member_balances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  advance_balance NUMERIC NOT NULL DEFAULT 0 CHECK (advance_balance >= 0),
  last_reconciled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, member_id)
);

-- Enable RLS
ALTER TABLE public.member_balances ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view member balances in their tenant"
ON public.member_balances
FOR SELECT
USING (
  is_super_admin(auth.uid()) OR 
  tenant_id = user_tenant_id(auth.uid())
);

CREATE POLICY "Admins and managers can insert member balances"
ON public.member_balances
FOR INSERT
WITH CHECK (
  is_super_admin(auth.uid()) OR 
  (tenant_id = user_tenant_id(auth.uid()) AND 
   (has_tenant_role(auth.uid(), tenant_id, 'admin') OR 
    has_tenant_role(auth.uid(), tenant_id, 'manager')))
);

CREATE POLICY "Admins and managers can update member balances"
ON public.member_balances
FOR UPDATE
USING (
  is_super_admin(auth.uid()) OR 
  (tenant_id = user_tenant_id(auth.uid()) AND 
   (has_tenant_role(auth.uid(), tenant_id, 'admin') OR 
    has_tenant_role(auth.uid(), tenant_id, 'manager')))
);

-- Create trigger for updated_at
CREATE TRIGGER update_member_balances_updated_at
BEFORE UPDATE ON public.member_balances
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_member_balances_member_id ON public.member_balances(member_id);
CREATE INDEX idx_member_balances_tenant_id ON public.member_balances(tenant_id);

-- Add advance_applied column to payments table for tracking
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS advance_applied NUMERIC DEFAULT 0;

-- Add advance_from_balance column to dues table for tracking
ALTER TABLE public.dues 
ADD COLUMN IF NOT EXISTS advance_from_balance NUMERIC DEFAULT 0;

-- Create payment_reconciliation_logs table for audit trail
CREATE TABLE public.payment_reconciliation_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on reconciliation logs
ALTER TABLE public.payment_reconciliation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reconciliation logs in their tenant"
ON public.payment_reconciliation_logs
FOR SELECT
USING (
  is_super_admin(auth.uid()) OR 
  tenant_id = user_tenant_id(auth.uid())
);

CREATE POLICY "System can insert reconciliation logs"
ON public.payment_reconciliation_logs
FOR INSERT
WITH CHECK (
  is_super_admin(auth.uid()) OR 
  tenant_id = user_tenant_id(auth.uid())
);

-- Create index for faster lookups
CREATE INDEX idx_payment_reconciliation_logs_payment_id ON public.payment_reconciliation_logs(payment_id);
CREATE INDEX idx_payment_reconciliation_logs_member_id ON public.payment_reconciliation_logs(member_id);