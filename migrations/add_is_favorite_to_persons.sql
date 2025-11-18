-- Add is_favorite column to persons table
-- This allows users to mark contacts as favorites for quick access

ALTER TABLE persons
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;

-- Create index for faster queries on favorite contacts
CREATE INDEX IF NOT EXISTS idx_persons_is_favorite
ON persons(user_id, is_favorite)
WHERE is_favorite = true;

-- Add comment to explain the column
COMMENT ON COLUMN persons.is_favorite IS 'Whether this contact is marked as a favorite by the user';
