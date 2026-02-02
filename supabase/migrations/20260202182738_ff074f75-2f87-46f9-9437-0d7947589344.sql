-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'manager', 'member');

-- Create enum for tenant status
CREATE TYPE public.tenant_status AS ENUM ('active', 'suspended', 'deleted');

-- Create enum for subscription status
CREATE TYPE public.subscription_status AS ENUM ('active', 'expired', 'cancelled');

-- Tenants table - stores all somiti organizations
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_bn TEXT,
  subdomain TEXT UNIQUE NOT NULL,
  default_language TEXT NOT NULL DEFAULT 'en' CHECK (default_language IN ('en', 'bn')),
  status tenant_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Subscriptions table - tracks subscription per tenant
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'standard',
  status subscription_status NOT NULL DEFAULT 'active',
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id)
);

-- User roles table - maps users to roles and optionally tenants
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_role_tenant_unique UNIQUE (user_id, role, tenant_id)
);

-- Audit logs table - tracks super admin actions
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_tenants_subdomain ON public.tenants(subdomain);
CREATE INDEX idx_tenants_status ON public.tenants(status);
CREATE INDEX idx_subscriptions_tenant_id ON public.subscriptions(tenant_id);
CREATE INDEX idx_subscriptions_end_date ON public.subscriptions(end_date);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_tenant_id ON public.user_roles(tenant_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_entity_type ON public.audit_logs(entity_type);

-- Enable RLS on all tables
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Security definer function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
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
      AND role = _role
  )
$$;

-- Security definer function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'super_admin')
$$;

-- Security definer function to get tenant by subdomain
CREATE OR REPLACE FUNCTION public.get_tenant_by_subdomain(_subdomain TEXT)
RETURNS public.tenants
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.tenants
  WHERE subdomain = _subdomain
    AND status != 'deleted'
$$;

-- RLS Policies for tenants table
-- Super admins can view all tenants
CREATE POLICY "Super admins can view all tenants"
  ON public.tenants
  FOR SELECT
  TO authenticated
  USING (public.is_super_admin(auth.uid()));

-- Super admins can insert tenants
CREATE POLICY "Super admins can create tenants"
  ON public.tenants
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_super_admin(auth.uid()));

-- Super admins can update tenants
CREATE POLICY "Super admins can update tenants"
  ON public.tenants
  FOR UPDATE
  TO authenticated
  USING (public.is_super_admin(auth.uid()));

-- RLS Policies for subscriptions table
-- Super admins can view all subscriptions
CREATE POLICY "Super admins can view all subscriptions"
  ON public.subscriptions
  FOR SELECT
  TO authenticated
  USING (public.is_super_admin(auth.uid()));

-- Super admins can insert subscriptions
CREATE POLICY "Super admins can create subscriptions"
  ON public.subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_super_admin(auth.uid()));

-- Super admins can update subscriptions
CREATE POLICY "Super admins can update subscriptions"
  ON public.subscriptions
  FOR UPDATE
  TO authenticated
  USING (public.is_super_admin(auth.uid()));

-- RLS Policies for user_roles table
-- Super admins can view all roles
CREATE POLICY "Super admins can view all roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (public.is_super_admin(auth.uid()));

-- Super admins can manage roles
CREATE POLICY "Super admins can manage roles"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (public.is_super_admin(auth.uid()));

-- Users can view their own roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for audit_logs table
-- Super admins can view all audit logs
CREATE POLICY "Super admins can view audit logs"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (public.is_super_admin(auth.uid()));

-- Super admins can insert audit logs
CREATE POLICY "Super admins can create audit logs"
  ON public.audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_super_admin(auth.uid()));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to validate subscription status
CREATE OR REPLACE FUNCTION public.validate_tenant_subscription(_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _tenant public.tenants;
  _subscription public.subscriptions;
  _result JSONB;
BEGIN
  -- Get tenant
  SELECT * INTO _tenant FROM public.tenants WHERE id = _tenant_id;
  
  IF _tenant IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Tenant not found');
  END IF;
  
  IF _tenant.status = 'suspended' THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Tenant is suspended');
  END IF;
  
  IF _tenant.status = 'deleted' THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Tenant has been deleted');
  END IF;
  
  -- Get subscription
  SELECT * INTO _subscription FROM public.subscriptions WHERE tenant_id = _tenant_id;
  
  IF _subscription IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'error', 'No subscription found');
  END IF;
  
  IF _subscription.status != 'active' THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Subscription is not active');
  END IF;
  
  IF _subscription.end_date < now() THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Subscription has expired');
  END IF;
  
  RETURN jsonb_build_object(
    'valid', true,
    'tenant_id', _tenant.id,
    'tenant_name', _tenant.name,
    'subscription_end', _subscription.end_date
  );
END;
$$;