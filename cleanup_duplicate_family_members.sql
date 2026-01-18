-- Clean up duplicate family members for Bryan Clay
-- This script removes duplicate family members with the same name (case-insensitive)

-- First, let's see what we're working with
SELECT 
  id,
  name,
  family_members
FROM persons 
WHERE id = 'b530be69-8c6e-467a-b4bc-324d3ff13f0e';

-- Function to deduplicate family members array
CREATE OR REPLACE FUNCTION deduplicate_family_members(members JSONB)
RETURNS JSONB AS $$
DECLARE
  result JSONB := '[]'::JSONB;
  member JSONB;
  seen_names TEXT[] := ARRAY[]::TEXT[];
  member_name TEXT;
BEGIN
  FOR member IN SELECT * FROM jsonb_array_elements(members)
  LOOP
    member_name := LOWER(member->>'name');
    
    IF NOT (member_name = ANY(seen_names)) THEN
      result := result || jsonb_build_array(member);
      seen_names := array_append(seen_names, member_name);
    END IF;
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Apply deduplication to Bryan's family members
UPDATE persons
SET family_members = deduplicate_family_members(family_members)
WHERE id = 'b530be69-8c6e-467a-b4bc-324d3ff13f0e'
  AND family_members IS NOT NULL
  AND jsonb_array_length(family_members) > 0;

-- Verify the cleanup
SELECT 
  id,
  name,
  family_members
FROM persons 
WHERE id = 'b530be69-8c6e-467a-b4bc-324d3ff13f0e';

-- Optional: Apply to all persons with duplicate family members
-- UPDATE persons
-- SET family_members = deduplicate_family_members(family_members)
-- WHERE family_members IS NOT NULL
--   AND jsonb_array_length(family_members) > 0;
