-- Migration: Inter-contact Relationships
-- Creates a self-referencing join table for linking contacts in a social graph
-- Run this in Supabase SQL Editor

-- Create relationship_role enum type (with IF NOT EXISTS pattern for safety)
DO $$ BEGIN
    CREATE TYPE relationship_role AS ENUM ('parent', 'child', 'spouse', 'partner', 'sibling', 'friend', 'colleague', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create the inter-contact relationships table
CREATE TABLE IF NOT EXISTS public.inter_contact_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id_a UUID REFERENCES public.persons(id) ON DELETE CASCADE,
  contact_id_b UUID REFERENCES public.persons(id) ON DELETE CASCADE,
  relationship_type relationship_role NOT NULL,
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure we don't duplicate the same relationship pair
  CONSTRAINT unique_contact_relationship UNIQUE(user_id, contact_id_a, contact_id_b),
  
  -- Prevent self-referential relationships
  CONSTRAINT no_self_relationship CHECK (contact_id_a != contact_id_b)
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_icr_user_id ON public.inter_contact_relationships(user_id);
CREATE INDEX IF NOT EXISTS idx_icr_contact_a ON public.inter_contact_relationships(contact_id_a);
CREATE INDEX IF NOT EXISTS idx_icr_contact_b ON public.inter_contact_relationships(contact_id_b);

-- Enable Row Level Security
ALTER TABLE public.inter_contact_relationships ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own relationships
CREATE POLICY "Users can view their own relationships"
  ON public.inter_contact_relationships
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own relationships"
  ON public.inter_contact_relationships
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own relationships"
  ON public.inter_contact_relationships
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own relationships"
  ON public.inter_contact_relationships
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to get inverse relationship type
CREATE OR REPLACE FUNCTION get_inverse_relationship(rel relationship_role)
RETURNS relationship_role AS $$
BEGIN
  CASE rel
    WHEN 'parent' THEN RETURN 'child';
    WHEN 'child' THEN RETURN 'parent';
    WHEN 'spouse' THEN RETURN 'spouse';
    WHEN 'partner' THEN RETURN 'partner';
    WHEN 'sibling' THEN RETURN 'sibling';
    WHEN 'friend' THEN RETURN 'friend';
    WHEN 'colleague' THEN RETURN 'colleague';
    ELSE RETURN 'other';
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_icr_updated_at ON public.inter_contact_relationships;
CREATE TRIGGER update_icr_updated_at
    BEFORE UPDATE ON public.inter_contact_relationships
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
