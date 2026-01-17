-- Verify the migration completed successfully
-- Run this to check what's actually in the database

-- 1. Check persons table columns
SELECT
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'persons'
  AND column_name IN ('summary_micro', 'summary_default', 'summary_full', 'summary_level_override')
ORDER BY column_name;

-- 2. Check user_settings columns
SELECT
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'user_settings'
  AND column_name = 'summary_level_default';

-- 3. Check if your user_settings row exists
SELECT
    user_id,
    summary_level_default,
    display_name
FROM user_settings
LIMIT 5;

-- 4. Check constraints
SELECT
    conname as constraint_name,
    contype as constraint_type
FROM pg_constraint
WHERE conname LIKE '%summary%';
