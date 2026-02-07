
-- Create notice_comments table
CREATE TABLE public.notice_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notice_id UUID NOT NULL REFERENCES public.notices(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notice_decisions table
CREATE TABLE public.notice_decisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notice_id UUID NOT NULL REFERENCES public.notices(id) ON DELETE CASCADE UNIQUE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  status TEXT NOT NULL CHECK (status IN ('approved', 'rejected', 'deferred')),
  decision_text TEXT NOT NULL,
  decided_by UUID NOT NULL,
  decided_by_name TEXT NOT NULL,
  decided_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notice_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notice_decisions ENABLE ROW LEVEL SECURITY;

-- RLS for notice_comments: tenant users can view comments for their tenant
CREATE POLICY "Tenant users can view notice comments"
ON public.notice_comments
FOR SELECT
USING (
  is_super_admin(auth.uid())
  OR tenant_id = user_tenant_id(auth.uid())
);

-- Only admins/managers/members within tenant can insert (enforced by edge function, but basic RLS)
CREATE POLICY "Tenant users can insert notice comments"
ON public.notice_comments
FOR INSERT
WITH CHECK (
  is_super_admin(auth.uid())
  OR tenant_id = user_tenant_id(auth.uid())
);

-- Admins can delete comments
CREATE POLICY "Admins can delete notice comments"
ON public.notice_comments
FOR DELETE
USING (
  is_super_admin(auth.uid())
  OR (tenant_id = user_tenant_id(auth.uid()) AND has_tenant_role(auth.uid(), tenant_id, 'admin'::app_role))
);

-- Users can update own comments (short time window enforced in edge function)
CREATE POLICY "Users can update own comments"
ON public.notice_comments
FOR UPDATE
USING (
  user_id = auth.uid()
  OR is_super_admin(auth.uid())
);

-- RLS for notice_decisions
CREATE POLICY "Tenant users can view notice decisions"
ON public.notice_decisions
FOR SELECT
USING (
  is_super_admin(auth.uid())
  OR tenant_id = user_tenant_id(auth.uid())
);

CREATE POLICY "Admins can insert notice decisions"
ON public.notice_decisions
FOR INSERT
WITH CHECK (
  is_super_admin(auth.uid())
  OR (tenant_id = user_tenant_id(auth.uid()) AND has_tenant_role(auth.uid(), tenant_id, 'admin'::app_role))
);

CREATE POLICY "Admins can update notice decisions"
ON public.notice_decisions
FOR UPDATE
USING (
  is_super_admin(auth.uid())
  OR (tenant_id = user_tenant_id(auth.uid()) AND has_tenant_role(auth.uid(), tenant_id, 'admin'::app_role))
);

-- Indexes
CREATE INDEX idx_notice_comments_notice_id ON public.notice_comments(notice_id);
CREATE INDEX idx_notice_comments_tenant_id ON public.notice_comments(tenant_id);
CREATE INDEX idx_notice_decisions_notice_id ON public.notice_decisions(notice_id);

-- Triggers for updated_at
CREATE TRIGGER update_notice_comments_updated_at
BEFORE UPDATE ON public.notice_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notice_decisions_updated_at
BEFORE UPDATE ON public.notice_decisions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
