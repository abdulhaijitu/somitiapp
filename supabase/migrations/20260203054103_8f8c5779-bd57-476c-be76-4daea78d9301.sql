-- Create contribution_types table for tenant-level payment categories
CREATE TABLE public.contribution_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_bn TEXT,
  description TEXT,
  description_bn TEXT,
  category_type TEXT NOT NULL DEFAULT 'other' CHECK (category_type IN ('monthly', 'fund_raise', 'other')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_fixed_amount BOOLEAN NOT NULL DEFAULT false,
  default_amount NUMERIC DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contribution_types ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view contribution types in their tenant"
ON public.contribution_types
FOR SELECT
USING (
  is_super_admin(auth.uid()) OR 
  tenant_id = user_tenant_id(auth.uid())
);

CREATE POLICY "Admins can manage contribution types"
ON public.contribution_types
FOR ALL
USING (
  is_super_admin(auth.uid()) OR 
  (tenant_id = user_tenant_id(auth.uid()) AND has_tenant_role(auth.uid(), tenant_id, 'admin'::app_role))
);

-- Add contribution_type_id to payments table
ALTER TABLE public.payments 
ADD COLUMN contribution_type_id UUID REFERENCES public.contribution_types(id);

-- Add photo_url to members table
ALTER TABLE public.members
ADD COLUMN photo_url TEXT;

-- Create index for faster lookups
CREATE INDEX idx_contribution_types_tenant ON public.contribution_types(tenant_id);
CREATE INDEX idx_payments_contribution_type ON public.payments(contribution_type_id);

-- Create trigger for updated_at
CREATE TRIGGER update_contribution_types_updated_at
BEFORE UPDATE ON public.contribution_types
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default contribution types for existing tenants
INSERT INTO public.contribution_types (tenant_id, name, name_bn, category_type, is_fixed_amount, default_amount, sort_order)
SELECT 
  id as tenant_id,
  'Monthly Contribution' as name,
  'মাসিক চাঁদা' as name_bn,
  'monthly' as category_type,
  true as is_fixed_amount,
  1000 as default_amount,
  1 as sort_order
FROM public.tenants
WHERE deleted_at IS NULL;

INSERT INTO public.contribution_types (tenant_id, name, name_bn, category_type, is_fixed_amount, default_amount, sort_order)
SELECT 
  id as tenant_id,
  'Fund Raise' as name,
  'ফান্ড রেইজ' as name_bn,
  'fund_raise' as category_type,
  false as is_fixed_amount,
  0 as default_amount,
  2 as sort_order
FROM public.tenants
WHERE deleted_at IS NULL;

INSERT INTO public.contribution_types (tenant_id, name, name_bn, category_type, is_fixed_amount, default_amount, sort_order)
SELECT 
  id as tenant_id,
  'Others' as name,
  'অন্যান্য' as name_bn,
  'other' as category_type,
  false as is_fixed_amount,
  0 as default_amount,
  3 as sort_order
FROM public.tenants
WHERE deleted_at IS NULL;