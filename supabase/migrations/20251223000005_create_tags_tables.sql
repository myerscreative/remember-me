-- Migration: Tags System
-- Created: 2025-12-23

-- 1. Create Tags Table (Global list of unique tags)
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Join Table (Person <-> Tag)
CREATE TABLE IF NOT EXISTS public.person_tags (
  person_id UUID REFERENCES public.persons(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (person_id, tag_id)
);

-- 3. Enable RLS
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.person_tags ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies

-- Tags are viewable by everyone (authed) to allow for shared suggestions (like interests)
CREATE POLICY "Tags are viewable by authenticated users" ON public.tags
  FOR SELECT TO authenticated USING (true);

-- Authenticated users can create tags
CREATE POLICY "Authenticated users can create tags" ON public.tags
  FOR INSERT TO authenticated WITH CHECK (true);

-- Person Tags: Users can only manage tags for their own contacts
CREATE POLICY "Users can view their contacts' tags" ON public.person_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.persons 
      WHERE persons.id = person_tags.person_id 
      AND persons.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert tags for their contacts" ON public.person_tags
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.persons 
      WHERE persons.id = person_tags.person_id 
      AND persons.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete tags from their contacts" ON public.person_tags
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.persons 
      WHERE persons.id = person_tags.person_id 
      AND persons.user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tags_name ON public.tags(name);
CREATE INDEX IF NOT EXISTS idx_person_tags_person_id ON public.person_tags(person_id);
CREATE INDEX IF NOT EXISTS idx_person_tags_tag_id ON public.person_tags(tag_id);
