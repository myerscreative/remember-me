-- ============================================
-- FIX PERSONS TABLE - Add All Missing Columns
-- ============================================
-- Run this in Supabase SQL Editor

-- Add all missing columns to persons table
ALTER TABLE persons
  -- Name fields
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  
  -- Contact information
  ADD COLUMN IF NOT EXISTS photo_url TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS linkedin TEXT,
  ADD COLUMN IF NOT EXISTS birthday DATE,
  ADD COLUMN IF NOT EXISTS family_members JSONB DEFAULT '[]'::jsonb,
  
  -- Connection context
  ADD COLUMN IF NOT EXISTS where_met TEXT,
  ADD COLUMN IF NOT EXISTS who_introduced TEXT,
  ADD COLUMN IF NOT EXISTS when_met DATE,
  
  -- Relationship insights
  ADD COLUMN IF NOT EXISTS why_stay_in_contact TEXT,
  ADD COLUMN IF NOT EXISTS what_found_interesting TEXT,
  ADD COLUMN IF NOT EXISTS most_important_to_them TEXT,
  ADD COLUMN IF NOT EXISTS interests TEXT[],
  
  -- Personal notes
  ADD COLUMN IF NOT EXISTS family_notes TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  
  -- Contact tracking
  ADD COLUMN IF NOT EXISTS last_contact TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS follow_up_reminder TIMESTAMP WITH TIME ZONE,
  
  -- Archive functionality
  ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS archived_reason TEXT,
  
  -- First impression capture
  ADD COLUMN IF NOT EXISTS first_impression TEXT,
  ADD COLUMN IF NOT EXISTS memorable_moment TEXT,
  
  -- Relationship value tracking
  ADD COLUMN IF NOT EXISTS relationship_value TEXT,
  ADD COLUMN IF NOT EXISTS what_i_offered TEXT,
  ADD COLUMN IF NOT EXISTS what_they_offered TEXT,
  
  -- Story completeness
  ADD COLUMN IF NOT EXISTS story_completeness INTEGER DEFAULT 0,
  
  -- Timestamps (if missing)
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Add constraints
ALTER TABLE persons
  DROP CONSTRAINT IF EXISTS email_format,
  ADD CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR email IS NULL);

ALTER TABLE persons
  DROP CONSTRAINT IF EXISTS name_not_empty,
  ADD CONSTRAINT name_not_empty CHECK (length(trim(name)) > 0);

ALTER TABLE persons
  DROP CONSTRAINT IF EXISTS first_name_not_empty,
  ADD CONSTRAINT first_name_not_empty CHECK (first_name IS NULL OR length(trim(first_name)) > 0);

-- Migrate existing name data to first_name if first_name is empty
UPDATE persons 
SET first_name = SPLIT_PART(name, ' ', 1)
WHERE first_name IS NULL AND name IS NOT NULL;

UPDATE persons 
SET last_name = SUBSTRING(name FROM POSITION(' ' IN name) + 1)
WHERE last_name IS NULL 
  AND name IS NOT NULL 
  AND POSITION(' ' IN name) > 0;

-- Set default values for new columns
UPDATE persons SET archived = FALSE WHERE archived IS NULL;
UPDATE persons SET story_completeness = 0 WHERE story_completeness IS NULL;
UPDATE persons SET family_members = '[]'::jsonb WHERE family_members IS NULL;

-- Create indexes for performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_persons_user_id ON persons(user_id);
CREATE INDEX IF NOT EXISTS idx_persons_first_name ON persons(first_name);
CREATE INDEX IF NOT EXISTS idx_persons_last_name ON persons(last_name);
CREATE INDEX IF NOT EXISTS idx_persons_email ON persons(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_persons_archived ON persons(user_id, archived) WHERE archived = FALSE;
CREATE INDEX IF NOT EXISTS idx_persons_last_contact ON persons(last_contact DESC NULLS LAST);

-- Verify columns were added
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'persons' 
  AND table_schema = 'public'
  AND column_name IN ('archived', 'first_impression', 'memorable_moment', 'first_name', 'last_name')
ORDER BY column_name;

-- Force schema cache reload (wait 30 seconds after running this)
NOTIFY pgrst, 'reload schema';
SELECT pg_notify('pgrst', 'reload schema');

-- Done!
SELECT 'Persons table updated successfully! All missing columns have been added. Wait 30 seconds for schema cache to refresh.' as result;

