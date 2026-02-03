-- Monthly Due Settings table (tenant-level configuration)
CREATE TABLE public.monthly_due_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  contribution_type_id UUID NOT NULL REFERENCES public.contribution_types(id) ON DELETE RESTRICT,
  fixed_amount NUMERIC NOT NULL CHECK (fixed_amount > 0),
  generation_day INTEGER NOT NULL DEFAULT 1 CHECK (generation_day >= 1 AND generation_day <= 28),
  start_month DATE NOT NULL DEFAULT date_trunc('month', now()),
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  include_members_joined_after_generation BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id) -- Only one active rule per tenant
);

-- Enable RLS
ALTER TABLE public.monthly_due_settings ENABLE ROW LEVEL SECURITY;

-- Dues table (auto-generated obligations)
CREATE TYPE public.due_status AS ENUM ('unpaid', 'partial', 'paid');

CREATE TABLE public.dues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  contribution_type_id UUID NOT NULL REFERENCES public.contribution_types(id) ON DELETE RESTRICT,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  paid_amount NUMERIC NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
  due_month DATE NOT NULL, -- First day of month (e.g., 2026-02-01)
  status public.due_status NOT NULL DEFAULT 'unpaid',
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, member_id, contribution_type_id, due_month) -- Prevent duplicates
);

-- Enable RLS
ALTER TABLE public.dues ENABLE ROW LEVEL SECURITY;

-- Add due_id to payments for linking
ALTER TABLE public.payments ADD COLUMN due_id UUID REFERENCES public.dues(id) ON DELETE SET NULL;

-- Indexes for performance
CREATE INDEX idx_dues_tenant_month ON public.dues(tenant_id, due_month);
CREATE INDEX idx_dues_member_status ON public.dues(member_id, status);
CREATE INDEX idx_payments_due_id ON public.payments(due_id) WHERE due_id IS NOT NULL;

-- RLS Policies for monthly_due_settings
CREATE POLICY "Admins can manage monthly due settings"
ON public.monthly_due_settings
FOR ALL
USING (
  is_super_admin(auth.uid()) OR 
  (tenant_id = user_tenant_id(auth.uid()) AND has_tenant_role(auth.uid(), tenant_id, 'admin'))
);

CREATE POLICY "Users can view monthly due settings in their tenant"
ON public.monthly_due_settings
FOR SELECT
USING (
  is_super_admin(auth.uid()) OR 
  tenant_id = user_tenant_id(auth.uid())
);

-- RLS Policies for dues
CREATE POLICY "Users can view dues in their tenant"
ON public.dues
FOR SELECT
USING (
  is_super_admin(auth.uid()) OR 
  tenant_id = user_tenant_id(auth.uid())
);

CREATE POLICY "System can insert dues"
ON public.dues
FOR INSERT
WITH CHECK (
  is_super_admin(auth.uid()) OR 
  tenant_id = user_tenant_id(auth.uid())
);

CREATE POLICY "Admins and managers can update dues"
ON public.dues
FOR UPDATE
USING (
  is_super_admin(auth.uid()) OR 
  (tenant_id = user_tenant_id(auth.uid()) AND 
   (has_tenant_role(auth.uid(), tenant_id, 'admin') OR has_tenant_role(auth.uid(), tenant_id, 'manager')))
);

-- Trigger for updated_at
CREATE TRIGGER update_monthly_due_settings_updated_at
  BEFORE UPDATE ON public.monthly_due_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dues_updated_at
  BEFORE UPDATE ON public.dues
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update due status based on payments
CREATE OR REPLACE FUNCTION public.update_due_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only process if due_id is set
  IF NEW.due_id IS NOT NULL AND NEW.status = 'paid' THEN
    -- Update the due's paid_amount
    UPDATE public.dues
    SET 
      paid_amount = paid_amount + NEW.amount,
      status = CASE 
        WHEN (paid_amount + NEW.amount) >= amount THEN 'paid'::due_status
        WHEN (paid_amount + NEW.amount) > 0 THEN 'partial'::due_status
        ELSE 'unpaid'::due_status
      END,
      updated_at = now()
    WHERE id = NEW.due_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to update due status when payment is completed
CREATE TRIGGER payment_updates_due_status
  AFTER UPDATE ON public.payments
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'paid')
  EXECUTE FUNCTION public.update_due_status();