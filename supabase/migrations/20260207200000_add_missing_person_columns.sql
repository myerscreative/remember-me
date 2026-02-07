-- Migration to add missing columns to persons table
-- These columns are referenced in the UI and validation schemas but were missing from the database

ALTER TABLE IF EXISTS public.persons 
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS zip_code TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS target_frequency_days INTEGER;

-- Update importance constraint to include 'critical'
ALTER TABLE public.persons 
  DROP CONSTRAINT IF EXISTS persons_importance_check;

ALTER TABLE public.persons 
  ADD CONSTRAINT persons_importance_check 
  CHECK (importance = ANY (ARRAY['high', 'medium', 'low', 'critical']));

-- Update contact_importance constraint if it exists
ALTER TABLE public.persons 
  DROP CONSTRAINT IF EXISTS persons_contact_importance_check;

ALTER TABLE public.persons 
  ADD CONSTRAINT persons_contact_importance_check 
  CHECK (contact_importance = ANY (ARRAY['high', 'medium', 'low', 'critical']));

-- Add comment for documentation
COMMENT ON COLUMN public.persons.address IS 'Street address of the contact';
COMMENT ON COLUMN public.persons.target_frequency_days IS 'Target number of days between interactions';
