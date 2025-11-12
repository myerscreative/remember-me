-- ============================================
-- FIX SCHEMA CACHE ISSUE - Run This in SQL Editor
-- ============================================

-- Step 1: Verify columns actually exist
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'persons' 
  AND table_schema = 'public'
  AND column_name IN ('first_impression', 'memorable_moment')
ORDER BY column_name;

-- Step 2: If columns exist, force aggressive schema reload
-- Run these commands one at a time:

-- Method 1: Standard reload
NOTIFY pgrst, 'reload schema';

-- Method 2: Alternative reload
SELECT pg_notify('pgrst', 'reload schema');

-- Method 3: Reload config too
SELECT pg_notify('pgrst', 'reload config');

-- Method 4: Kill all PostgREST connections (forces restart)
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE usename = 'authenticator' 
  AND application_name LIKE '%postgrest%';

-- Step 3: Wait 30 seconds, then verify schema was reloaded
SELECT 'Schema reload commands executed at: ' || NOW() as status;

-- ============================================
-- IF STILL NOT WORKING:
-- ============================================
-- Go to Supabase Dashboard → Settings → General
-- Find "Pause project" button → Click it
-- Wait 30 seconds
-- Click "Resume" or "Restore"
-- This forces a complete restart of all services


