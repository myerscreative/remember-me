-- Migration: Add Contact Facts Table
-- Run this in Supabase SQL Editor

-- Create the contact_facts table for storing key relationship details
CREATE TABLE IF NOT EXISTS public.contact_facts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES public.persons(id) ON DELETE CASCADE NOT NULL,
  category TEXT DEFAULT 'general', -- 'career', 'family', 'interest', 'goal', 'general'
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups by contact
CREATE INDEX IF NOT EXISTS idx_contact_facts_contact_id ON public.contact_facts(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_facts_category ON public.contact_facts(category);

-- Enable Row Level Security
ALTER TABLE public.contact_facts ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access facts for their own contacts
CREATE POLICY "Users can view facts for their contacts"
  ON public.contact_facts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.persons 
      WHERE persons.id = contact_facts.contact_id 
      AND persons.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert facts for their contacts"
  ON public.contact_facts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.persons 
      WHERE persons.id = contact_facts.contact_id 
      AND persons.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update facts for their contacts"
  ON public.contact_facts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.persons 
      WHERE persons.id = contact_facts.contact_id 
      AND persons.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete facts for their contacts"
  ON public.contact_facts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.persons 
      WHERE persons.id = contact_facts.contact_id 
      AND persons.user_id = auth.uid()
    )
  );

-- Grant permissions
GRANT ALL ON public.contact_facts TO authenticated;

-- Trigger for updated_at timestamp
CREATE TRIGGER update_contact_facts_updated_at
  BEFORE UPDATE ON public.contact_facts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Completion message
DO $$
BEGIN
  RAISE NOTICE 'contact_facts table created successfully!';
END $$;
