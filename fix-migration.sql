-- Fixed migration with better error handling
-- Run this in Supabase SQL Editor

-- Step 1: Add columns to persons table
DO $$
BEGIN
    -- Add summary_micro if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'persons' AND column_name = 'summary_micro'
    ) THEN
        ALTER TABLE persons ADD COLUMN summary_micro TEXT;
        RAISE NOTICE 'Added summary_micro column';
    ELSE
        RAISE NOTICE 'summary_micro already exists';
    END IF;

    -- Add summary_default if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'persons' AND column_name = 'summary_default'
    ) THEN
        ALTER TABLE persons ADD COLUMN summary_default TEXT;
        RAISE NOTICE 'Added summary_default column';
    ELSE
        RAISE NOTICE 'summary_default already exists';
    END IF;

    -- Add summary_full if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'persons' AND column_name = 'summary_full'
    ) THEN
        ALTER TABLE persons ADD COLUMN summary_full TEXT;
        RAISE NOTICE 'Added summary_full column';
    ELSE
        RAISE NOTICE 'summary_full already exists';
    END IF;

    -- Add summary_level_override if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'persons' AND column_name = 'summary_level_override'
    ) THEN
        ALTER TABLE persons ADD COLUMN summary_level_override TEXT;
        ALTER TABLE persons ADD CONSTRAINT persons_summary_level_override_check
            CHECK (summary_level_override IN ('micro', 'default', 'full'));
        RAISE NOTICE 'Added summary_level_override column';
    ELSE
        RAISE NOTICE 'summary_level_override already exists';
    END IF;
END $$;

-- Step 2: Add column to user_settings table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_settings' AND column_name = 'summary_level_default'
    ) THEN
        ALTER TABLE user_settings ADD COLUMN summary_level_default TEXT DEFAULT 'default';
        ALTER TABLE user_settings ADD CONSTRAINT user_settings_summary_level_default_check
            CHECK (summary_level_default IN ('micro', 'default', 'full'));
        RAISE NOTICE 'Added summary_level_default column';
    ELSE
        RAISE NOTICE 'summary_level_default already exists';
    END IF;
END $$;

-- Step 3: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_persons_summary_micro
    ON persons(summary_micro) WHERE summary_micro IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_persons_summary_default
    ON persons(summary_default) WHERE summary_default IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_persons_summary_full
    ON persons(summary_full) WHERE summary_full IS NOT NULL;

-- Step 4: Migrate existing relationship_summary to summary_default
UPDATE persons
SET summary_default = relationship_summary
WHERE relationship_summary IS NOT NULL
  AND summary_default IS NULL;

-- Verify the migration
SELECT
    'persons.summary_micro' as column_name,
    COUNT(*) FILTER (WHERE summary_micro IS NOT NULL) as populated_count,
    COUNT(*) as total_count
FROM persons
UNION ALL
SELECT
    'persons.summary_default',
    COUNT(*) FILTER (WHERE summary_default IS NOT NULL),
    COUNT(*)
FROM persons
UNION ALL
SELECT
    'persons.summary_full',
    COUNT(*) FILTER (WHERE summary_full IS NOT NULL),
    COUNT(*)
FROM persons
UNION ALL
SELECT
    'user_settings.summary_level_default',
    COUNT(*) FILTER (WHERE summary_level_default IS NOT NULL),
    COUNT(*)
FROM user_settings;
