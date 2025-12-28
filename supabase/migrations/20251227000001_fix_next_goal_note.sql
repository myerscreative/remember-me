-- Fix: Add next_goal_note column to interactions table
-- The original migration 20251213000001 ran BEFORE the interactions table was created
-- (table created in 20251217060000), so the column was never actually added.
-- This migration safely adds the column if it doesn't exist.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'interactions' 
    AND column_name = 'next_goal_note'
  ) THEN
    ALTER TABLE interactions ADD COLUMN next_goal_note TEXT;
    RAISE NOTICE 'Added next_goal_note column to interactions table';
  ELSE
    RAISE NOTICE 'next_goal_note column already exists';
  END IF;
END $$;
