-- Create a table to define the 5 Core Domains
CREATE TABLE IF NOT EXISTS public.tag_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL, -- Friends, Relationships, Interests, Work, Travel
  icon TEXT,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tag_domains ENABLE ROW LEVEL SECURITY;

-- Create policy for read access (all authenticated users)
CREATE POLICY "Enable read access for authenticated users" 
ON public.tag_domains FOR SELECT 
TO authenticated 
USING (true);

-- Seed the Domains
INSERT INTO public.tag_domains (name, icon, color) VALUES
('Relationships', 'heart', '#f43f5e'),
('Interests', 'trophy', '#3b82f6'),
('Travel', 'plane', '#8b5cf6'),
('Work', 'briefcase', '#64748b'),
('Friends', 'users', '#10b981')
ON CONFLICT (name) DO UPDATE SET
  icon = EXCLUDED.icon,
  color = EXCLUDED.color;
