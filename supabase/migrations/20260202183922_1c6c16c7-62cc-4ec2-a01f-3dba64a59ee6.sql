-- Create payment status enum
CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'failed', 'cancelled', 'refunded');

-- Create payment method enum
CREATE TYPE public.payment_method AS ENUM ('offline', 'bkash', 'nagad', 'rocket', 'card', 'other');

-- Create members table (needed for payment references)
CREATE TABLE public.members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_bn TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  member_number TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  monthly_amount NUMERIC(10,2) DEFAULT 1000,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payments table
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  
  -- Payment details
  amount NUMERIC(10,2) NOT NULL,
  fee NUMERIC(10,2) DEFAULT 0,
  charged_amount NUMERIC(10,2),
  
  -- Payment method and status
  payment_type TEXT NOT NULL DEFAULT 'offline' CHECK (payment_type IN ('offline', 'online')),
  payment_method public.payment_method NOT NULL DEFAULT 'offline',
  status public.payment_status NOT NULL DEFAULT 'pending',
  
  -- UddoktaPay specific fields
  invoice_id TEXT UNIQUE,
  transaction_id TEXT,
  sender_number TEXT,
  payment_url TEXT,
  
  -- Metadata
  reference TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  payment_date TIMESTAMP WITH TIME ZONE,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- For which period
  period_month INTEGER,
  period_year INTEGER
);

-- Create payment_logs table for audit trail
CREATE TABLE public.payment_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  previous_status public.payment_status,
  new_status public.payment_status,
  details JSONB DEFAULT '{}',
  performed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;

-- Create helper function to check tenant membership
CREATE OR REPLACE FUNCTION public.user_tenant_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Create helper function to check if user has role in tenant
CREATE OR REPLACE FUNCTION public.has_tenant_role(_user_id UUID, _tenant_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND tenant_id = _tenant_id
      AND role = _role
  )
$$;

-- Members RLS policies
CREATE POLICY "Users can view members in their tenant"
ON public.members
FOR SELECT
USING (
  is_super_admin(auth.uid()) OR
  tenant_id = user_tenant_id(auth.uid())
);

CREATE POLICY "Admins and managers can insert members"
ON public.members
FOR INSERT
WITH CHECK (
  is_super_admin(auth.uid()) OR
  (tenant_id = user_tenant_id(auth.uid()) AND 
   (has_tenant_role(auth.uid(), tenant_id, 'admin') OR 
    has_tenant_role(auth.uid(), tenant_id, 'manager')))
);

CREATE POLICY "Admins and managers can update members"
ON public.members
FOR UPDATE
USING (
  is_super_admin(auth.uid()) OR
  (tenant_id = user_tenant_id(auth.uid()) AND 
   (has_tenant_role(auth.uid(), tenant_id, 'admin') OR 
    has_tenant_role(auth.uid(), tenant_id, 'manager')))
);

-- Payments RLS policies
CREATE POLICY "Users can view payments in their tenant"
ON public.payments
FOR SELECT
USING (
  is_super_admin(auth.uid()) OR
  tenant_id = user_tenant_id(auth.uid())
);

CREATE POLICY "Admins and managers can insert payments"
ON public.payments
FOR INSERT
WITH CHECK (
  is_super_admin(auth.uid()) OR
  (tenant_id = user_tenant_id(auth.uid()) AND 
   (has_tenant_role(auth.uid(), tenant_id, 'admin') OR 
    has_tenant_role(auth.uid(), tenant_id, 'manager')))
);

CREATE POLICY "Admins and managers can update payments"
ON public.payments
FOR UPDATE
USING (
  is_super_admin(auth.uid()) OR
  (tenant_id = user_tenant_id(auth.uid()) AND 
   (has_tenant_role(auth.uid(), tenant_id, 'admin') OR 
    has_tenant_role(auth.uid(), tenant_id, 'manager')))
);

-- Payment logs RLS policies
CREATE POLICY "Users can view payment logs in their tenant"
ON public.payment_logs
FOR SELECT
USING (
  is_super_admin(auth.uid()) OR
  tenant_id = user_tenant_id(auth.uid())
);

CREATE POLICY "System can insert payment logs"
ON public.payment_logs
FOR INSERT
WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_members_tenant ON public.members(tenant_id);
CREATE INDEX idx_members_status ON public.members(status);
CREATE INDEX idx_payments_tenant ON public.payments(tenant_id);
CREATE INDEX idx_payments_member ON public.payments(member_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_invoice ON public.payments(invoice_id);
CREATE INDEX idx_payments_date ON public.payments(payment_date);
CREATE INDEX idx_payment_logs_payment ON public.payment_logs(payment_id);

-- Triggers for updated_at
CREATE TRIGGER update_members_updated_at
BEFORE UPDATE ON public.members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();