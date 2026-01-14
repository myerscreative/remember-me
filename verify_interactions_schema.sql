-- Run this in Supabase SQL Editor to verify the interactions table schema

-- 1. Check if next_goal_note column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'interactions'
ORDER BY ordinal_position;

-- 2. Check the type constraint
SELECT
    con.conname AS constraint_name,
    pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
INNER JOIN pg_class rel ON rel.oid = con.conrelid
INNER JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE nsp.nspname = 'public'
AND rel.relname = 'interactions'
AND con.contype = 'c'; -- CHECK constraints only

-- 3. Test if we can insert a record with 'in-person' type
-- This will fail if the constraint doesn't allow it
-- Comment out the SELECT below and uncomment the INSERT to test
-- INSERT INTO interactions (person_id, user_id, type, date, notes)
-- VALUES (
--   'test-person-id',
--   auth.uid(),
--   'in-person',
--   NOW(),
--   'Test interaction'
-- );

SELECT 'Schema verification complete. Review the results above.' AS status;
