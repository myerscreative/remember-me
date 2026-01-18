-- Add soft delete support to persons table
-- Contacts marked as deleted can be recovered within 30 days

ALTER TABLE persons ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

COMMENT ON COLUMN persons.deleted_at IS 'Timestamp when contact was soft-deleted. NULL = active, set = deleted (recoverable for 30 days)';

-- Create index for filtering out deleted contacts
CREATE INDEX IF NOT EXISTS idx_persons_deleted_at ON persons(deleted_at) WHERE deleted_at IS NULL;
