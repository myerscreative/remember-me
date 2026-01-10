-- Ensure interactions table has correct column names
-- This migration handles the case where the table might have been created with old column names

DO $$ 
BEGIN
  -- Check if old column names exist and rename them
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'interactions' AND column_name = 'interaction_type'
  ) THEN
    ALTER TABLE interactions RENAME COLUMN interaction_type TO type;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'interactions' AND column_name = 'interaction_date'
  ) THEN
    ALTER TABLE interactions RENAME COLUMN interaction_date TO date;
  END IF;
END $$;

-- Ensure the type column has the correct check constraint
DO $$
BEGIN
  -- Drop old constraint if it exists
  ALTER TABLE interactions DROP CONSTRAINT IF EXISTS interactions_type_check;
  ALTER TABLE interactions DROP CONSTRAINT IF EXISTS interactions_interaction_type_check;
  
  -- Add correct constraint
  ALTER TABLE interactions ADD CONSTRAINT interactions_type_check 
    CHECK (type IN ('call', 'email', 'text', 'meeting', 'other', 'in-person', 'social'));
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Constraint update skipped: %', SQLERRM;
END $$;
