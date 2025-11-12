-- Add hobbies field to persons table
-- This allows storing a text description of a person's hobbies

ALTER TABLE persons 
ADD COLUMN IF NOT EXISTS hobbies TEXT;

COMMENT ON COLUMN persons.hobbies IS 'Text description of the person''s hobbies and activities';


