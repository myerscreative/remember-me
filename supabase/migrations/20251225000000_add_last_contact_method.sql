-- Add last_contact_method column to persons table
ALTER TABLE persons ADD COLUMN IF NOT EXISTS last_contact_method text;

-- Add comment for documentation
COMMENT ON COLUMN persons.last_contact_method IS 'Method of last contact: call, email, text, or meeting';
