-- Diagnostic query to check current schema
-- Run this first to see what's missing

-- Check persons table columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'persons'
  AND column_name IN ('summary_micro', 'summary_default', 'summary_full', 'summary_level_override')
ORDER BY column_name;

-- Check user_settings columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_settings'
  AND column_name = 'summary_level_default'
ORDER BY column_name;

-- If results are empty, columns don't exist and migration failed
