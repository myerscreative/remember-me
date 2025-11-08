-- Migration: Add first_name and last_name fields to persons table
-- Run this in Supabase SQL Editor
-- This migration is idempotent - safe to run multiple times

-- Add new columns only if they don't exist (nullable for existing records)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'persons' AND column_name = 'first_name'
  ) THEN
    ALTER TABLE persons ADD COLUMN first_name TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'persons' AND column_name = 'last_name'
  ) THEN
    ALTER TABLE persons ADD COLUMN last_name TEXT;
  END IF;
END $$;

-- Migrate existing name data to first_name and last_name
-- Only update rows where first_name or last_name is NULL
UPDATE persons 
SET 
  first_name = CASE 
    WHEN first_name IS NULL THEN
      CASE 
        WHEN name ~ ' ' THEN split_part(name, ' ', 1)
        ELSE name
      END
    ELSE first_name
  END,
  last_name = CASE 
    WHEN last_name IS NULL THEN
      CASE 
        WHEN name ~ ' ' THEN substring(name from position(' ' in name) + 1)
        ELSE NULL
      END
    ELSE last_name
  END
WHERE first_name IS NULL OR last_name IS NULL;

-- Make first_name required (after migration) - only if not already NOT NULL
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'persons' 
    AND column_name = 'first_name' 
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE persons ALTER COLUMN first_name SET NOT NULL;
  END IF;
END $$;

-- Update constraint to check first_name instead of name
ALTER TABLE persons DROP CONSTRAINT IF EXISTS name_not_empty;
ALTER TABLE persons DROP CONSTRAINT IF EXISTS first_name_not_empty;

ALTER TABLE persons 
ADD CONSTRAINT first_name_not_empty CHECK (length(trim(first_name)) > 0);

-- Add index for faster searches on first and last name
CREATE INDEX IF NOT EXISTS idx_persons_first_name ON persons(first_name);
CREATE INDEX IF NOT EXISTS idx_persons_last_name ON persons(last_name);

-- Update full-text search to use first_name and last_name
-- Drop old index if exists
DROP INDEX IF EXISTS idx_persons_name_search;
-- Create new composite index
CREATE INDEX IF NOT EXISTS idx_persons_name_search ON persons USING gin(to_tsvector('english', coalesce(first_name, '') || ' ' || coalesce(last_name, '')));
