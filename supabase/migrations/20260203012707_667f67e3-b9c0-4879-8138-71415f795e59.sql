-- Add user_id column to members table to link with auth.users
ALTER TABLE public.members 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create unique index to ensure one auth user per member
CREATE UNIQUE INDEX idx_members_user_id ON public.members(user_id) WHERE user_id IS NOT NULL;

-- Create index for faster lookups
CREATE INDEX idx_members_phone ON public.members(phone) WHERE phone IS NOT NULL;

-- Update RLS policy to allow members to view their own data
CREATE POLICY "Members can view their own profile"
ON public.members
FOR SELECT
USING (user_id = auth.uid());

-- Allow members to update limited fields of their own profile
CREATE POLICY "Members can update their own profile"
ON public.members
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());