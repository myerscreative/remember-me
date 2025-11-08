-- Update Tom's birthday to December 1st
UPDATE persons 
SET birthday = '2024-12-01'::DATE
WHERE name ILIKE '%Tom%';

-- Verify the update
SELECT name, birthday FROM persons WHERE name ILIKE '%Tom%';



