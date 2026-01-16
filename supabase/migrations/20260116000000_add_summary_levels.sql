-- Add three-tier summary storage to persons table
ALTER TABLE persons
ADD COLUMN IF NOT EXISTS summary_micro TEXT,
ADD COLUMN IF NOT EXISTS summary_default TEXT,
ADD COLUMN IF NOT EXISTS summary_full TEXT,
ADD COLUMN IF NOT EXISTS summary_level_override TEXT CHECK (summary_level_override IN ('micro', 'default', 'full'));

-- Add default summary level preference to user_settings
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS summary_level_default TEXT DEFAULT 'default' CHECK (summary_level_default IN ('micro', 'default', 'full'));

-- Create index for faster summary queries
CREATE INDEX IF NOT EXISTS idx_persons_summary_micro ON persons(summary_micro) WHERE summary_micro IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_persons_summary_default ON persons(summary_default) WHERE summary_default IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_persons_summary_full ON persons(summary_full) WHERE summary_full IS NOT NULL;

-- Migrate existing relationship_summary to summary_default
UPDATE persons
SET summary_default = relationship_summary
WHERE relationship_summary IS NOT NULL
AND summary_default IS NULL;
