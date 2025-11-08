-- Migration: Add family_members field to persons table
-- Run this in Supabase SQL Editor

-- Add family_members JSONB field to store structured family information
-- Format: [{"name": "John", "relationship": "spouse"}, {"name": "Sarah", "relationship": "child"}, ...]
ALTER TABLE persons 
ADD COLUMN IF NOT EXISTS family_members JSONB DEFAULT '[]'::jsonb;

-- Add index for querying family members
CREATE INDEX IF NOT EXISTS idx_persons_family_members ON persons USING gin(family_members);

-- Add comment
COMMENT ON COLUMN persons.family_members IS 'Array of family member objects with name and relationship fields';

