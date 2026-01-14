-- Add ai_summary column to persons table
-- This stores the AI-generated synopsis for display in the Overview tab
-- deep_lore stores the full history, ai_summary stores the latest synopsis

ALTER TABLE persons
ADD COLUMN IF NOT EXISTS ai_summary TEXT;

-- Add index for faster queries when checking if ai_summary exists
CREATE INDEX IF NOT EXISTS idx_persons_ai_summary
ON persons(user_id, ai_summary)
WHERE ai_summary IS NOT NULL;

-- Add comment to document the field
COMMENT ON COLUMN persons.ai_summary IS 'AI-generated synopsis of the person (latest version) for Overview tab display';
