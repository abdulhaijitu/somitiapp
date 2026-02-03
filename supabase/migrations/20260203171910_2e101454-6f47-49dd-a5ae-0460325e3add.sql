-- Add policy for super admins to view and manage contact submissions
CREATE POLICY "Super admins can view contact submissions"
ON public.contact_submissions
FOR SELECT
USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can manage contact submissions"
ON public.contact_submissions
FOR ALL
USING (is_super_admin(auth.uid()));