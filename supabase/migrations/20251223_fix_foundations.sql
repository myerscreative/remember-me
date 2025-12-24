-- Foundation Fix Migration
-- Creates missing tables identified in System Audit (Dec 23, 2025)

-- ============================================
-- 1. Create Facts Table for the Story Tab
-- ============================================
CREATE TABLE IF NOT EXISTS public.contact_facts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES public.persons(id) ON DELETE CASCADE,
  category TEXT DEFAULT 'general',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on contact_facts
ALTER TABLE public.contact_facts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contact_facts (via persons.user_id join)
CREATE POLICY "Users can view own contact facts" ON public.contact_facts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.persons 
      WHERE persons.id = contact_facts.contact_id 
      AND persons.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own contact facts" ON public.contact_facts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.persons 
      WHERE persons.id = contact_facts.contact_id 
      AND persons.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own contact facts" ON public.contact_facts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.persons 
      WHERE persons.id = contact_facts.contact_id 
      AND persons.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own contact facts" ON public.contact_facts
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.persons 
      WHERE persons.id = contact_facts.contact_id 
      AND persons.user_id = auth.uid()
    )
  );

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_contact_facts_contact_id ON public.contact_facts(contact_id);

-- ============================================
-- 2. Create Relationships Table for Family Tab
-- ============================================
CREATE TABLE IF NOT EXISTS public.inter_contact_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id_a UUID REFERENCES public.persons(id) ON DELETE CASCADE,
  contact_id_b UUID REFERENCES public.persons(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add unique constraint only if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_relationship'
  ) THEN
    ALTER TABLE public.inter_contact_relationships
    ADD CONSTRAINT unique_relationship UNIQUE(contact_id_a, contact_id_b);
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.inter_contact_relationships ENABLE ROW LEVEL SECURITY;

-- RLS Policies for inter_contact_relationships
CREATE POLICY "Users can view own relationships" ON public.inter_contact_relationships
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own relationships" ON public.inter_contact_relationships
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own relationships" ON public.inter_contact_relationships
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own relationships" ON public.inter_contact_relationships
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes for faster relationship lookups
CREATE INDEX IF NOT EXISTS idx_relationships_user_id ON public.inter_contact_relationships(user_id);
CREATE INDEX IF NOT EXISTS idx_relationships_contact_a ON public.inter_contact_relationships(contact_id_a);
CREATE INDEX IF NOT EXISTS idx_relationships_contact_b ON public.inter_contact_relationships(contact_id_b);

-- ============================================
-- 3. Unify Interaction Naming
-- ============================================
-- Ensure the interactions table uses 'notes' (plural) to match current UI code
DO $$ 
BEGIN 
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='interactions' AND column_name='note'
  ) THEN
    ALTER TABLE public.interactions RENAME COLUMN note TO notes;
  END IF;
END $$;
