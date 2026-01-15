-- ============================================
-- COMPLETE FIX FOR INTERACTION_DATE COLUMN ISSUE
-- ============================================
-- This SQL script fixes all references to the old 'interaction_date' column
-- Run this in your Supabase Dashboard > SQL Editor
-- ============================================

-- Step 1: Drop and recreate the person_interaction_counts view with correct column name
DROP VIEW IF EXISTS person_interaction_counts;

CREATE VIEW person_interaction_counts
WITH (security_invoker = true)
AS
SELECT
  person_id,
  COUNT(*) as total_interactions,
  MAX(date) as last_interaction_date,  -- Changed from interaction_date to date
  COUNT(*) FILTER (WHERE type = 'meeting') as meeting_count,  -- Changed interaction_type to type
  COUNT(*) FILTER (WHERE type = 'call') as call_count,
  COUNT(*) FILTER (WHERE type = 'email') as email_count
FROM interactions
GROUP BY person_id;

-- Step 2: Fix the update_person_last_contact trigger function
CREATE OR REPLACE FUNCTION update_person_last_contact()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE persons
  SET last_contact = NEW.date  -- Changed from NEW.interaction_date to NEW.date
  WHERE id = NEW.person_id
    AND (last_contact IS NULL OR last_contact < NEW.date);  -- Changed from interaction_date to date
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

-- Step 3: Verify the trigger exists and is attached
DROP TRIGGER IF EXISTS update_person_last_contact_trigger ON interactions;

CREATE TRIGGER update_person_last_contact_trigger
  AFTER INSERT ON interactions
  FOR EACH ROW
  EXECUTE FUNCTION update_person_last_contact();

-- Step 4: Verify the column names are correct
-- This will show an error if the column doesn't exist
DO $$
BEGIN
  PERFORM 1 FROM information_schema.columns
  WHERE table_name = 'interactions' AND column_name = 'date';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Column interactions.date does not exist! Run migration 20260109000003_rename_interaction_columns.sql first';
  END IF;

  PERFORM 1 FROM information_schema.columns
  WHERE table_name = 'interactions' AND column_name = 'type';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Column interactions.type does not exist! Run migration 20260109000003_rename_interaction_columns.sql first';
  END IF;

  RAISE NOTICE 'All column names are correct!';
END $$;

-- Success message
SELECT 'Fix applied successfully! You can now log interactions.' as status;
