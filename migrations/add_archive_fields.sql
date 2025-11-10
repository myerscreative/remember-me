-- Migration: Add archive fields to persons table
-- This enables archiving contacts instead of permanently deleting them

-- Add archive-related columns to persons table
ALTER TABLE persons 
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS archived_reason TEXT;

-- Add index for querying active (non-archived) contacts
CREATE INDEX IF NOT EXISTS idx_persons_archived ON persons(user_id, archived) WHERE archived = false;

-- Add comments for documentation
COMMENT ON COLUMN persons.archived IS 'Whether this contact is archived (soft delete)';
COMMENT ON COLUMN persons.archived_at IS 'Timestamp when the contact was archived';
COMMENT ON COLUMN persons.archived_reason IS 'User-provided reason for archiving this contact';

