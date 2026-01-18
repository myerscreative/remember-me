-- Migration: Add Block 7 - Mutual Value & Introductions
-- This adds the 7th information block for tracking reciprocal value

ALTER TABLE persons ADD COLUMN IF NOT EXISTS
  mutual_value_introductions TEXT;

COMMENT ON COLUMN persons.mutual_value_introductions IS 'Block 7: Mutual value, introductions, collaboration opportunities';
