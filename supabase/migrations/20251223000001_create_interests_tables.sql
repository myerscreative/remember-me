-- Migration: Interests & Tagging System
-- Created: 2025-12-23

-- 1. Create Interests Table (Global list of unique interests)
CREATE TABLE IF NOT EXISTS public.interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Join Table (Person <-> Interest)
CREATE TABLE IF NOT EXISTS public.person_interests (
  person_id UUID REFERENCES public.persons(id) ON DELETE CASCADE,
  interest_id UUID REFERENCES public.interests(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (person_id, interest_id)
);

-- 3. Enable RLS
ALTER TABLE public.interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.person_interests ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies

-- Interests are viewable by everyone (authed) to allow for shared suggestions
CREATE POLICY "Interests are viewable by authenticated users" ON public.interests
  FOR SELECT TO authenticated USING (true);

-- Users can insert new interests if they don't exist (handled by code via upsert usually, or separate admin policy)
-- Let's allow authenticated users to create new interests (growing the global list)
CREATE POLICY "Authenticated users can create interests" ON public.interests
  FOR INSERT TO authenticated WITH CHECK (true);

-- Person Interests: Users can only manage interests for their own contacts
CREATE POLICY "Users can view their contacts' interests" ON public.person_interests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.persons 
      WHERE persons.id = person_interests.person_id 
      AND persons.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert interests for their contacts" ON public.person_interests
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.persons 
      WHERE persons.id = person_interests.person_id 
      AND persons.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete interests from their contacts" ON public.person_interests
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.persons 
      WHERE persons.id = person_interests.person_id 
      AND persons.user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_interests_name ON public.interests(name);
CREATE INDEX IF NOT EXISTS idx_person_interests_person_id ON public.person_interests(person_id);
CREATE INDEX IF NOT EXISTS idx_person_interests_interest_id ON public.person_interests(interest_id);
