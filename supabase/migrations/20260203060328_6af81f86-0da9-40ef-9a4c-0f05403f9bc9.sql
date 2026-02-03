-- Add NID number column to members table
ALTER TABLE public.members 
ADD COLUMN nid_number text NULL;