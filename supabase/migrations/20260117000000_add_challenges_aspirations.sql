-- Add challenges and aspirations fields to persons table
ALTER TABLE persons 
ADD COLUMN IF NOT EXISTS current_challenges TEXT,
ADD COLUMN IF NOT EXISTS goals_aspirations TEXT;

-- Add comment for documentation
COMMENT ON COLUMN persons.current_challenges IS 'Current challenges, struggles, or obstacles the person is facing';
COMMENT ON COLUMN persons.goals_aspirations IS 'Goals, aspirations, dreams, what drives them';
