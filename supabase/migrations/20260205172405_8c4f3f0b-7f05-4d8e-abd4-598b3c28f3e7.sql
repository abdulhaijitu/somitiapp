-- Create notice status enum
CREATE TYPE public.notice_status AS ENUM ('draft', 'published');

-- Create notices table
CREATE TABLE public.notices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  title_bn TEXT,
  content TEXT NOT NULL,
  content_bn TEXT,
  status public.notice_status NOT NULL DEFAULT 'draft',
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_notices_tenant_status ON public.notices(tenant_id, status);
CREATE INDEX idx_notices_published_at ON public.notices(published_at DESC);

-- Enable RLS
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admins and managers can view all notices in their tenant
CREATE POLICY "Admins and managers can view all notices"
ON public.notices
FOR SELECT
USING (
  is_super_admin(auth.uid()) OR 
  (
    tenant_id = user_tenant_id(auth.uid()) AND 
    (
      has_tenant_role(auth.uid(), tenant_id, 'admin') OR 
      has_tenant_role(auth.uid(), tenant_id, 'manager')
    )
  )
);

-- RLS Policy: Members can only view published notices in their tenant
CREATE POLICY "Members can view published notices"
ON public.notices
FOR SELECT
USING (
  tenant_id = user_tenant_id(auth.uid()) AND 
  status = 'published'
);

-- RLS Policy: Admins can insert notices
CREATE POLICY "Admins can insert notices"
ON public.notices
FOR INSERT
WITH CHECK (
  is_super_admin(auth.uid()) OR 
  (
    tenant_id = user_tenant_id(auth.uid()) AND 
    has_tenant_role(auth.uid(), tenant_id, 'admin')
  )
);

-- RLS Policy: Managers can insert draft notices only
CREATE POLICY "Managers can insert draft notices"
ON public.notices
FOR INSERT
WITH CHECK (
  tenant_id = user_tenant_id(auth.uid()) AND 
  has_tenant_role(auth.uid(), tenant_id, 'manager') AND
  status = 'draft'
);

-- RLS Policy: Admins can update notices
CREATE POLICY "Admins can update notices"
ON public.notices
FOR UPDATE
USING (
  is_super_admin(auth.uid()) OR 
  (
    tenant_id = user_tenant_id(auth.uid()) AND 
    has_tenant_role(auth.uid(), tenant_id, 'admin')
  )
);

-- RLS Policy: Admins can delete notices
CREATE POLICY "Admins can delete notices"
ON public.notices
FOR DELETE
USING (
  is_super_admin(auth.uid()) OR 
  (
    tenant_id = user_tenant_id(auth.uid()) AND 
    has_tenant_role(auth.uid(), tenant_id, 'admin')
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_notices_updated_at
BEFORE UPDATE ON public.notices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();