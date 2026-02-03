-- Create notification types enum
CREATE TYPE public.notification_type AS ENUM (
  'otp',
  'payment_success',
  'payment_failed',
  'payment_reminder',
  'dues_reminder',
  'system_alert',
  'admin_alert'
);

-- Create delivery channel enum
CREATE TYPE public.notification_channel AS ENUM (
  'sms',
  'in_app',
  'email'
);

-- Create delivery status enum
CREATE TYPE public.delivery_status AS ENUM (
  'pending',
  'sent',
  'delivered',
  'failed',
  'read'
);

-- Create notifications table for in-app notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
  notification_type notification_type NOT NULL,
  title TEXT NOT NULL,
  title_bn TEXT,
  message TEXT NOT NULL,
  message_bn TEXT,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create SMS logs table for audit and tracking
CREATE TABLE public.sms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  notification_type notification_type NOT NULL,
  message TEXT NOT NULL,
  provider TEXT,
  provider_message_id TEXT,
  status delivery_status NOT NULL DEFAULT 'pending',
  error_message TEXT,
  cost NUMERIC(10, 4),
  idempotency_key TEXT UNIQUE,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create notification preferences table per tenant
CREATE TABLE public.notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE UNIQUE,
  payment_success_sms BOOLEAN DEFAULT TRUE,
  payment_failed_sms BOOLEAN DEFAULT TRUE,
  dues_reminder_enabled BOOLEAN DEFAULT TRUE,
  dues_reminder_day INTEGER DEFAULT 1 CHECK (dues_reminder_day >= 1 AND dues_reminder_day <= 28),
  overdue_reminder_enabled BOOLEAN DEFAULT TRUE,
  overdue_reminder_frequency_days INTEGER DEFAULT 7 CHECK (overdue_reminder_frequency_days >= 1 AND overdue_reminder_frequency_days <= 30),
  admin_alert_on_failed_payment BOOLEAN DEFAULT TRUE,
  admin_alert_on_high_overdue BOOLEAN DEFAULT TRUE,
  high_overdue_threshold INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create rate limiting table for SMS
CREATE TABLE public.sms_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  notification_type notification_type NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (phone_number, notification_type)
);

-- Enable RLS on all tables
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_rate_limits ENABLE ROW LEVEL SECURITY;

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (
  is_super_admin(auth.uid()) OR
  user_id = auth.uid() OR
  (tenant_id = user_tenant_id(auth.uid()) AND member_id IS NOT NULL)
);

CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (
  is_super_admin(auth.uid()) OR
  tenant_id = user_tenant_id(auth.uid())
);

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (
  user_id = auth.uid() OR
  (tenant_id = user_tenant_id(auth.uid()) AND (
    has_tenant_role(auth.uid(), tenant_id, 'admin') OR
    has_tenant_role(auth.uid(), tenant_id, 'manager')
  ))
);

-- SMS logs policies (admin only viewing)
CREATE POLICY "Admins can view SMS logs"
ON public.sms_logs FOR SELECT
USING (
  is_super_admin(auth.uid()) OR
  (tenant_id = user_tenant_id(auth.uid()) AND has_tenant_role(auth.uid(), tenant_id, 'admin'))
);

CREATE POLICY "System can insert SMS logs"
ON public.sms_logs FOR INSERT
WITH CHECK (
  is_super_admin(auth.uid()) OR
  tenant_id = user_tenant_id(auth.uid())
);

-- Notification settings policies
CREATE POLICY "Admins can manage notification settings"
ON public.notification_settings FOR ALL
USING (
  is_super_admin(auth.uid()) OR
  (tenant_id = user_tenant_id(auth.uid()) AND has_tenant_role(auth.uid(), tenant_id, 'admin'))
);

-- Rate limits policies (service role only in practice)
CREATE POLICY "System can manage rate limits"
ON public.sms_rate_limits FOR ALL
USING (is_super_admin(auth.uid()));

-- Create indexes for performance
CREATE INDEX idx_notifications_tenant_user ON public.notifications(tenant_id, user_id);
CREATE INDEX idx_notifications_member ON public.notifications(member_id);
CREATE INDEX idx_notifications_unread ON public.notifications(tenant_id, user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_sms_logs_tenant ON public.sms_logs(tenant_id);
CREATE INDEX idx_sms_logs_phone ON public.sms_logs(phone_number);
CREATE INDEX idx_sms_logs_idempotency ON public.sms_logs(idempotency_key);
CREATE INDEX idx_sms_rate_limits_phone_type ON public.sms_rate_limits(phone_number, notification_type);

-- Trigger to update notification_settings updated_at
CREATE TRIGGER update_notification_settings_updated_at
BEFORE UPDATE ON public.notification_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();