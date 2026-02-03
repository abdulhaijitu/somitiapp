-- Create plan type enum
CREATE TYPE public.subscription_plan AS ENUM ('starter', 'standard', 'premium', 'custom');

-- Create plan limits configuration table
CREATE TABLE public.plan_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan subscription_plan NOT NULL UNIQUE,
  name TEXT NOT NULL,
  name_bn TEXT,
  description TEXT,
  description_bn TEXT,
  max_members INTEGER NOT NULL DEFAULT 50,
  max_members_unlimited BOOLEAN DEFAULT FALSE,
  online_payments_enabled BOOLEAN DEFAULT FALSE,
  sms_monthly_quota INTEGER NOT NULL DEFAULT 100,
  report_history_months INTEGER NOT NULL DEFAULT 3,
  advanced_reports BOOLEAN DEFAULT FALSE,
  early_access_features BOOLEAN DEFAULT FALSE,
  monthly_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  yearly_price DECIMAL(10,2),
  is_popular BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create add-on types enum
CREATE TYPE public.addon_type AS ENUM ('sms_bundle', 'member_pack', 'report_history', 'custom_module');

-- Create add-ons configuration table
CREATE TABLE public.addon_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  addon_type addon_type NOT NULL,
  name TEXT NOT NULL,
  name_bn TEXT,
  description TEXT,
  description_bn TEXT,
  quantity INTEGER NOT NULL,
  unit TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  validity_days INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create tenant add-on purchases table
CREATE TABLE public.tenant_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  addon_config_id UUID NOT NULL REFERENCES public.addon_configs(id),
  quantity_purchased INTEGER NOT NULL,
  quantity_used INTEGER DEFAULT 0,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create tenant usage tracking table
CREATE TABLE public.tenant_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE UNIQUE,
  member_count INTEGER DEFAULT 0,
  sms_used_this_month INTEGER DEFAULT 0,
  sms_month_reset_at TIMESTAMPTZ NOT NULL DEFAULT date_trunc('month', now()) + INTERVAL '1 month',
  total_sms_sent INTEGER DEFAULT 0,
  total_payments_processed DECIMAL(12,2) DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create custom pricing table for special cases
CREATE TABLE public.tenant_custom_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE UNIQUE,
  custom_monthly_price DECIMAL(10,2),
  custom_yearly_price DECIMAL(10,2),
  discount_percentage INTEGER,
  discount_reason TEXT,
  valid_until TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Modify subscriptions table: drop default, convert type, add new default
ALTER TABLE public.subscriptions ALTER COLUMN plan DROP DEFAULT;
ALTER TABLE public.subscriptions ALTER COLUMN plan TYPE subscription_plan USING plan::subscription_plan;
ALTER TABLE public.subscriptions ALTER COLUMN plan SET DEFAULT 'standard'::subscription_plan;

-- Enable RLS
ALTER TABLE public.plan_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addon_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_custom_pricing ENABLE ROW LEVEL SECURITY;

-- Plan configs are readable by all authenticated users
CREATE POLICY "Plan configs are publicly readable"
  ON public.plan_configs FOR SELECT
  TO authenticated
  USING (true);

-- Only super_admin can modify plan configs
CREATE POLICY "Only super_admin can modify plan configs"
  ON public.plan_configs FOR ALL
  TO authenticated
  USING (public.is_super_admin(auth.uid()));

-- Addon configs are readable by all
CREATE POLICY "Addon configs are publicly readable"
  ON public.addon_configs FOR SELECT
  TO authenticated
  USING (true);

-- Only super_admin can modify addon configs
CREATE POLICY "Only super_admin can modify addon configs"
  ON public.addon_configs FOR ALL
  TO authenticated
  USING (public.is_super_admin(auth.uid()));

-- Tenant addons: tenant users can view their own
CREATE POLICY "Tenant users can view their addons"
  ON public.tenant_addons FOR SELECT
  TO authenticated
  USING (tenant_id = public.user_tenant_id(auth.uid()) OR public.is_super_admin(auth.uid()));

-- Only super_admin can manage tenant addons
CREATE POLICY "Only super_admin can manage tenant addons"
  ON public.tenant_addons FOR ALL
  TO authenticated
  USING (public.is_super_admin(auth.uid()));

-- Tenant usage: tenant users can view their own
CREATE POLICY "Tenant users can view their usage"
  ON public.tenant_usage FOR SELECT
  TO authenticated
  USING (tenant_id = public.user_tenant_id(auth.uid()) OR public.is_super_admin(auth.uid()));

-- Super admin can manage all usage
CREATE POLICY "Super admin can manage usage"
  ON public.tenant_usage FOR ALL
  TO authenticated
  USING (public.is_super_admin(auth.uid()));

-- Custom pricing visibility
CREATE POLICY "Custom pricing visibility"
  ON public.tenant_custom_pricing FOR SELECT
  TO authenticated
  USING (tenant_id = public.user_tenant_id(auth.uid()) OR public.is_super_admin(auth.uid()));

CREATE POLICY "Only super_admin can manage custom pricing"
  ON public.tenant_custom_pricing FOR ALL
  TO authenticated
  USING (public.is_super_admin(auth.uid()));

-- Insert default plan configurations
INSERT INTO public.plan_configs (plan, name, name_bn, description, description_bn, max_members, online_payments_enabled, sms_monthly_quota, report_history_months, advanced_reports, early_access_features, monthly_price, yearly_price, is_popular, sort_order)
VALUES
  ('starter', 'Starter', 'স্টার্টার', 'Perfect for small somitis just getting started', 'ছোট সমিতির জন্য উপযুক্ত', 25, FALSE, 50, 3, FALSE, FALSE, 299, 2990, FALSE, 1),
  ('standard', 'Standard', 'স্ট্যান্ডার্ড', 'Most popular choice for growing somitis', 'বড় হতে থাকা সমিতির জন্য জনপ্রিয়', 100, TRUE, 200, 12, FALSE, FALSE, 599, 5990, TRUE, 2),
  ('premium', 'Premium', 'প্রিমিয়াম', 'For large somitis needing full features', 'সম্পূর্ণ ফিচার সহ বড় সমিতির জন্য', 500, TRUE, 500, 36, TRUE, TRUE, 999, 9990, FALSE, 3),
  ('custom', 'Custom', 'কাস্টম', 'Tailored plans for special requirements', 'বিশেষ প্রয়োজনের জন্য কাস্টম প্ল্যান', 1000, TRUE, 1000, 60, TRUE, TRUE, 0, 0, FALSE, 4);

-- Insert default add-on configurations
INSERT INTO public.addon_configs (addon_type, name, name_bn, description, description_bn, quantity, unit, price, validity_days, sort_order)
VALUES
  ('sms_bundle', 'SMS Pack - 100', '১০০ SMS প্যাক', 'Additional 100 SMS credits', 'অতিরিক্ত ১০০ SMS ক্রেডিট', 100, 'sms', 99, 30, 1),
  ('sms_bundle', 'SMS Pack - 500', '৫০০ SMS প্যাক', 'Additional 500 SMS credits', 'অতিরিক্ত ৫০০ SMS ক্রেডিট', 500, 'sms', 399, 30, 2),
  ('member_pack', 'Member Pack - 25', '২৫ সদস্য প্যাক', 'Additional 25 member slots', 'অতিরিক্ত ২৫ সদস্য স্লট', 25, 'members', 199, NULL, 3),
  ('member_pack', 'Member Pack - 50', '৫০ সদস্য প্যাক', 'Additional 50 member slots', 'অতিরিক্ত ৫০ সদস্য স্লট', 50, 'members', 349, NULL, 4),
  ('report_history', 'Report History - 12 Months', '১২ মাস রিপোর্ট', 'Extended report history access', 'বর্ধিত রিপোর্ট হিস্ট্রি', 12, 'months', 299, 365, 5);

-- Create function to get tenant plan limits
CREATE OR REPLACE FUNCTION public.get_tenant_plan_limits(_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _subscription subscriptions;
  _plan_config plan_configs;
  _usage tenant_usage;
  _member_addon_count INTEGER;
  _sms_addon_count INTEGER;
  _result JSONB;
BEGIN
  SELECT * INTO _subscription FROM subscriptions WHERE tenant_id = _tenant_id;
  
  IF _subscription IS NULL THEN
    RETURN jsonb_build_object('error', 'No subscription found');
  END IF;
  
  SELECT * INTO _plan_config FROM plan_configs WHERE plan = _subscription.plan;
  
  IF _plan_config IS NULL THEN
    RETURN jsonb_build_object('error', 'Plan configuration not found');
  END IF;
  
  SELECT * INTO _usage FROM tenant_usage WHERE tenant_id = _tenant_id;
  
  IF _usage IS NULL THEN
    INSERT INTO tenant_usage (tenant_id) VALUES (_tenant_id)
    RETURNING * INTO _usage;
  END IF;
  
  SELECT COALESCE(SUM(quantity_purchased - quantity_used), 0)::INTEGER
  INTO _member_addon_count
  FROM tenant_addons ta
  JOIN addon_configs ac ON ta.addon_config_id = ac.id
  WHERE ta.tenant_id = _tenant_id 
    AND ta.is_active = TRUE
    AND ac.addon_type = 'member_pack'
    AND (ta.expires_at IS NULL OR ta.expires_at > now());
  
  SELECT COALESCE(SUM(quantity_purchased - quantity_used), 0)::INTEGER
  INTO _sms_addon_count
  FROM tenant_addons ta
  JOIN addon_configs ac ON ta.addon_config_id = ac.id
  WHERE ta.tenant_id = _tenant_id 
    AND ta.is_active = TRUE
    AND ac.addon_type = 'sms_bundle'
    AND (ta.expires_at IS NULL OR ta.expires_at > now());
  
  _result := jsonb_build_object(
    'plan', _subscription.plan,
    'plan_name', _plan_config.name,
    'plan_name_bn', _plan_config.name_bn,
    'subscription_status', _subscription.status,
    'subscription_end_date', _subscription.end_date,
    'limits', jsonb_build_object(
      'max_members', CASE WHEN _plan_config.max_members_unlimited THEN 999999 ELSE _plan_config.max_members + _member_addon_count END,
      'max_members_base', _plan_config.max_members,
      'max_members_addon', _member_addon_count,
      'sms_quota', _plan_config.sms_monthly_quota + _sms_addon_count,
      'sms_quota_base', _plan_config.sms_monthly_quota,
      'sms_quota_addon', _sms_addon_count,
      'online_payments', _plan_config.online_payments_enabled,
      'advanced_reports', _plan_config.advanced_reports,
      'report_history_months', _plan_config.report_history_months,
      'early_access', _plan_config.early_access_features
    ),
    'usage', jsonb_build_object(
      'member_count', _usage.member_count,
      'sms_used', _usage.sms_used_this_month,
      'sms_reset_at', _usage.sms_month_reset_at
    )
  );
  
  RETURN _result;
END;
$$;

-- Create function to check if tenant can perform action
CREATE OR REPLACE FUNCTION public.check_tenant_limit(_tenant_id UUID, _limit_type TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _limits JSONB;
  _can_proceed BOOLEAN := FALSE;
  _message TEXT;
  _message_bn TEXT;
  _current_usage INTEGER;
  _max_limit INTEGER;
BEGIN
  _limits := public.get_tenant_plan_limits(_tenant_id);
  
  IF _limits ? 'error' THEN
    RETURN jsonb_build_object('allowed', FALSE, 'error', _limits->>'error');
  END IF;
  
  CASE _limit_type
    WHEN 'add_member' THEN
      _current_usage := (_limits->'usage'->>'member_count')::INTEGER;
      _max_limit := (_limits->'limits'->>'max_members')::INTEGER;
      _can_proceed := _current_usage < _max_limit;
      _message := format('Member limit reached (%s/%s). Upgrade your plan or purchase a member pack.', _current_usage, _max_limit);
      _message_bn := format('সদস্য সীমা পূর্ণ (%s/%s)। প্ল্যান আপগ্রেড করুন অথবা মেম্বার প্যাক কিনুন।', _current_usage, _max_limit);
      
    WHEN 'send_sms' THEN
      _current_usage := (_limits->'usage'->>'sms_used')::INTEGER;
      _max_limit := (_limits->'limits'->>'sms_quota')::INTEGER;
      _can_proceed := _current_usage < _max_limit;
      _message := format('SMS quota exhausted (%s/%s). Purchase an SMS bundle to continue.', _current_usage, _max_limit);
      _message_bn := format('SMS কোটা শেষ (%s/%s)। চালিয়ে যেতে SMS বান্ডেল কিনুন।', _current_usage, _max_limit);
      
    WHEN 'online_payment' THEN
      _can_proceed := (_limits->'limits'->>'online_payments')::BOOLEAN;
      _message := 'Online payments are not available on your current plan. Upgrade to Standard or higher.';
      _message_bn := 'অনলাইন পেমেন্ট আপনার বর্তমান প্ল্যানে উপলব্ধ নয়। স্ট্যান্ডার্ড বা উচ্চতর প্ল্যানে আপগ্রেড করুন।';
      
    WHEN 'advanced_reports' THEN
      _can_proceed := (_limits->'limits'->>'advanced_reports')::BOOLEAN;
      _message := 'Advanced reports require Premium plan.';
      _message_bn := 'অ্যাডভান্সড রিপোর্টের জন্য প্রিমিয়াম প্ল্যান প্রয়োজন।';
      
    ELSE
      _can_proceed := TRUE;
  END CASE;
  
  RETURN jsonb_build_object(
    'allowed', _can_proceed,
    'limit_type', _limit_type,
    'current_usage', _current_usage,
    'max_limit', _max_limit,
    'message', CASE WHEN NOT _can_proceed THEN _message ELSE NULL END,
    'message_bn', CASE WHEN NOT _can_proceed THEN _message_bn ELSE NULL END,
    'plan', _limits->>'plan'
  );
END;
$$;

-- Create trigger to update member count
CREATE OR REPLACE FUNCTION public.update_tenant_member_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO tenant_usage (tenant_id, member_count)
    VALUES (NEW.tenant_id, 1)
    ON CONFLICT (tenant_id) 
    DO UPDATE SET member_count = tenant_usage.member_count + 1, updated_at = now();
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE tenant_usage 
    SET member_count = GREATEST(0, member_count - 1), updated_at = now()
    WHERE tenant_id = OLD.tenant_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trigger_update_member_count
AFTER INSERT OR DELETE ON public.members
FOR EACH ROW
EXECUTE FUNCTION public.update_tenant_member_count();

-- Create trigger to update SMS count
CREATE OR REPLACE FUNCTION public.update_tenant_sms_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'sent' THEN
    INSERT INTO tenant_usage (tenant_id, sms_used_this_month, total_sms_sent)
    VALUES (NEW.tenant_id, 1, 1)
    ON CONFLICT (tenant_id) 
    DO UPDATE SET 
      sms_used_this_month = tenant_usage.sms_used_this_month + 1,
      total_sms_sent = tenant_usage.total_sms_sent + 1,
      updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_sms_count
AFTER INSERT ON public.sms_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_tenant_sms_count();

-- Add indexes for performance
CREATE INDEX idx_tenant_addons_tenant ON tenant_addons(tenant_id);
CREATE INDEX idx_tenant_addons_active ON tenant_addons(tenant_id) WHERE is_active = TRUE;
CREATE INDEX idx_tenant_usage_tenant ON tenant_usage(tenant_id);