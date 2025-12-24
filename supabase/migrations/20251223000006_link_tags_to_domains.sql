-- Add domain_id columns to existing tables
-- This migration runs after tags and interests tables are created

-- Add a domain_id to the interests table
ALTER TABLE public.interests 
ADD COLUMN IF NOT EXISTS domain_id UUID REFERENCES public.tag_domains(id);

-- Add a domain_id to the tags table
ALTER TABLE public.tags 
ADD COLUMN IF NOT EXISTS domain_id UUID REFERENCES public.tag_domains(id);
