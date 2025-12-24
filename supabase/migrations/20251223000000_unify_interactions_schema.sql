-- Migration: Unify interactions schema (fix 'notes' vs 'note' and type constraints)
-- Run this in Supabase SQL Editor to ensure database matches application code

-- 1. Ensure 'notes' column exists (rename 'note' if it exists, or add if neither)
DO $$ 
BEGIN 
  -- If 'note' exists (from 2023 migration) and 'notes' (from 2025 migration) does NOT exist
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='interactions' AND column_name='note') 
     AND NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='interactions' AND column_name='notes') THEN
    ALTER TABLE public.interactions RENAME COLUMN note TO notes;
  
  -- If BOTH exist (rare edge case), we move data from note to notes and drop note
  ELSIF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='interactions' AND column_name='note') 
     AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='interactions' AND column_name='notes') THEN
     -- Move data from note to notes if note is not null
     UPDATE public.interactions SET notes = note WHERE notes IS NULL AND note IS NOT NULL;
     ALTER TABLE public.interactions DROP COLUMN note;
     
  -- If neither exists (unlikely if table exists), add notes
  ELSIF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='interactions' AND column_name='notes') THEN
    ALTER TABLE public.interactions ADD COLUMN notes TEXT;
  END IF;
END $$;

-- 2. Fix the check constraint to include all app-supported types
-- (in-person, social, etc. might be missing in 2025 migration)
DO $$ 
BEGIN
  -- We attempt to drop the constraint named 'interactions_type_check'
  BEGIN
    ALTER TABLE public.interactions DROP CONSTRAINT IF EXISTS interactions_type_check;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  
  -- Also attempt to drop a potentially auto-generated name if the above didn't catch the one blocking us,
  -- but usually explicit naming is better. If 2025 migration created it inline without name, 
  -- Postgres assigns a name like interactions_type_check.
  
  -- Re-apply correct constraint
  ALTER TABLE public.interactions ADD CONSTRAINT interactions_type_check 
  CHECK (type IN ('call', 'text', 'email', 'in-person', 'social', 'other'));
  
EXCEPTION WHEN OTHERS THEN 
  RAISE NOTICE 'Error updating constraint: %', SQLERRM;
END $$;
