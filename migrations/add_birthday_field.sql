-- Migration: Add birthday field to persons table
-- Run this in Supabase SQL Editor to add the birthday field to existing databases

ALTER TABLE persons 
ADD COLUMN IF NOT EXISTS birthday DATE;

COMMENT ON COLUMN persons.birthday IS 'Birthday date for the contact (stored as DATE, month and day only)';

-- Set Tom's birthday to December 1st for testing
UPDATE persons 
SET birthday = '2024-12-01'::DATE
WHERE name ILIKE '%Tom%';

