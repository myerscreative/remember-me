-- Add milestones column to persons table
ALTER TABLE persons 
ADD COLUMN IF NOT EXISTS milestones JSONB DEFAULT '[]'::jsonb;

-- Add index for better JSONB querying if needed later (optional but good practice)
CREATE INDEX IF NOT EXISTS idx_persons_milestones ON persons USING gin (milestones);
