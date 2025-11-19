-- ============================================
-- ReMember Me - Database Setup for Recent Improvements
-- ============================================
--
-- Run this SQL in your Supabase SQL Editor to add the required
-- database changes for the favorites feature.
--
-- Instructions:
-- 1. Go to your Supabase Dashboard
-- 2. Click "SQL Editor" in the left sidebar
-- 3. Click "New Query"
-- 4. Copy and paste this entire file
-- 5. Click "Run" (or press Cmd/Ctrl + Enter)
-- 6. You should see "Success. No rows returned"
--
-- ============================================

-- Add is_favorite column to persons table
-- This allows users to mark contacts as favorites for quick access
ALTER TABLE persons
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;

-- Create index for faster queries on favorite contacts
-- This speeds up filtering and displaying favorite contacts
CREATE INDEX IF NOT EXISTS idx_persons_is_favorite
ON persons(user_id, is_favorite)
WHERE is_favorite = true;

-- Add comment to explain the column
COMMENT ON COLUMN persons.is_favorite IS 'Whether this contact is marked as a favorite by the user';

-- ============================================
-- Migration Complete!
-- ============================================
--
-- You should now be able to:
-- - Mark contacts as favorites by clicking the star icon
-- - Filter contacts by "Favorites" on the main page
-- - Favorites will sync across all your devices
--
-- ============================================
