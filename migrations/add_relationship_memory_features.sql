-- ============================================
-- ReMember Me - Relationship Memory Features
-- ============================================
-- Adds features for archiving, first impressions, and relationship context

-- 1. Add archive functionality to persons table
ALTER TABLE persons
  ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS archived_reason TEXT;

COMMENT ON COLUMN persons.archived IS 'Whether this relationship has been archived (not deleted, just inactive)';
COMMENT ON COLUMN persons.archived_at IS 'When the relationship was archived';
COMMENT ON COLUMN persons.archived_reason IS 'User note on why this was archived (e.g., "Connection naturally ended", "Moved on from this industry")';

-- 2. Add first impression capture
ALTER TABLE persons
  ADD COLUMN IF NOT EXISTS first_impression TEXT,
  ADD COLUMN IF NOT EXISTS memorable_moment TEXT;

COMMENT ON COLUMN persons.first_impression IS 'User''s immediate impression when first meeting this person';
COMMENT ON COLUMN persons.memorable_moment IS 'What made this first conversation/meeting memorable';

-- 3. Add relationship value tracking
ALTER TABLE persons
  ADD COLUMN IF NOT EXISTS relationship_value TEXT,
  ADD COLUMN IF NOT EXISTS what_i_offered TEXT,
  ADD COLUMN IF NOT EXISTS what_they_offered TEXT;

COMMENT ON COLUMN persons.relationship_value IS 'Why this relationship is valuable to maintain';
COMMENT ON COLUMN persons.what_i_offered IS 'What I''ve contributed to this relationship';
COMMENT ON COLUMN persons.what_they_offered IS 'What they''ve contributed to this relationship';

-- 4. Add story completeness tracking
ALTER TABLE persons
  ADD COLUMN IF NOT EXISTS story_completeness INTEGER DEFAULT 0;

COMMENT ON COLUMN persons.story_completeness IS 'Calculated percentage (0-100) of how complete the relationship story is';

-- 5. Create index for archived contacts
CREATE INDEX IF NOT EXISTS idx_persons_archived ON persons(user_id, archived) WHERE archived = FALSE;
CREATE INDEX IF NOT EXISTS idx_persons_archived_at ON persons(archived_at) WHERE archived = TRUE;

-- 6. Create function to calculate story completeness
CREATE OR REPLACE FUNCTION calculate_story_completeness(person persons)
RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 0;
  total_fields INTEGER := 15;
BEGIN
  -- Basic info (3 fields)
  IF person.first_name IS NOT NULL AND length(trim(person.first_name)) > 0 THEN score := score + 1; END IF;
  IF person.email IS NOT NULL OR person.phone IS NOT NULL OR person.linkedin IS NOT NULL THEN score := score + 1; END IF;
  IF person.birthday IS NOT NULL THEN score := score + 1; END IF;

  -- Context (3 fields)
  IF person.where_met IS NOT NULL AND length(trim(person.where_met)) > 0 THEN score := score + 1; END IF;
  IF person.when_met IS NOT NULL THEN score := score + 1; END IF;
  IF person.first_impression IS NOT NULL AND length(trim(person.first_impression)) > 0 THEN score := score + 1; END IF;

  -- Story (4 fields)
  IF person.why_stay_in_contact IS NOT NULL AND length(trim(person.why_stay_in_contact)) > 30 THEN score := score + 1; END IF;
  IF person.what_found_interesting IS NOT NULL AND length(trim(person.what_found_interesting)) > 30 THEN score := score + 1; END IF;
  IF person.most_important_to_them IS NOT NULL AND length(trim(person.most_important_to_them)) > 30 THEN score := score + 1; END IF;
  IF person.memorable_moment IS NOT NULL AND length(trim(person.memorable_moment)) > 30 THEN score := score + 1; END IF;

  -- Details (3 fields)
  IF person.interests IS NOT NULL AND array_length(person.interests, 1) > 0 THEN score := score + 1; END IF;
  IF person.family_members IS NOT NULL AND jsonb_array_length(person.family_members) > 0 THEN score := score + 1; END IF;
  IF EXISTS (SELECT 1 FROM person_tags WHERE person_id = person.id LIMIT 1) THEN score := score + 1; END IF;

  -- Relationship value (2 fields)
  IF person.relationship_value IS NOT NULL AND length(trim(person.relationship_value)) > 20 THEN score := score + 1; END IF;
  IF person.last_contact IS NOT NULL THEN score := score + 1; END IF;

  RETURN (score * 100) / total_fields;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION calculate_story_completeness IS 'Calculates how complete a relationship story is (0-100%)';

-- 7. Create function to detect relationship decay
CREATE OR REPLACE FUNCTION get_decaying_relationships(p_user_id UUID, days_threshold INTEGER DEFAULT 180)
RETURNS TABLE (
  person_id UUID,
  name TEXT,
  last_contact_days INTEGER,
  interaction_count BIGINT,
  decay_severity TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.first_name || ' ' || COALESCE(p.last_name, '') as full_name,
    EXTRACT(DAY FROM (NOW() - COALESCE(p.last_contact, p.created_at)))::INTEGER as days_since_contact,
    COALESCE(ic.interaction_count, 0) as interactions,
    CASE
      WHEN EXTRACT(DAY FROM (NOW() - COALESCE(p.last_contact, p.created_at))) > 365 THEN 'severe'
      WHEN EXTRACT(DAY FROM (NOW() - COALESCE(p.last_contact, p.created_at))) > 180 THEN 'moderate'
      ELSE 'mild'
    END as severity
  FROM persons p
  LEFT JOIN (
    SELECT person_id, COUNT(*) as interaction_count
    FROM interactions
    GROUP BY person_id
  ) ic ON p.id = ic.person_id
  WHERE p.user_id = p_user_id
    AND p.archived = FALSE
    AND EXTRACT(DAY FROM (NOW() - COALESCE(p.last_contact, p.created_at))) > days_threshold
  ORDER BY days_since_contact DESC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_decaying_relationships IS 'Finds relationships that may need attention or archiving';

-- 8. Create function for context-based search
CREATE OR REPLACE FUNCTION search_persons_by_context(
  p_user_id UUID,
  search_query TEXT
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  first_name TEXT,
  last_name TEXT,
  photo_url TEXT,
  match_type TEXT,
  match_field TEXT,
  relevance FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (p.id)
    p.id,
    p.name,
    p.first_name,
    p.last_name,
    p.photo_url,
    CASE
      WHEN p.where_met ILIKE '%' || search_query || '%' THEN 'context'
      WHEN p.who_introduced ILIKE '%' || search_query || '%' THEN 'context'
      WHEN p.why_stay_in_contact ILIKE '%' || search_query || '%' THEN 'story'
      WHEN p.what_found_interesting ILIKE '%' || search_query || '%' THEN 'story'
      WHEN p.most_important_to_them ILIKE '%' || search_query || '%' THEN 'story'
      WHEN p.first_impression ILIKE '%' || search_query || '%' THEN 'impression'
      WHEN p.memorable_moment ILIKE '%' || search_query || '%' THEN 'moment'
      WHEN EXISTS (SELECT 1 FROM unnest(p.interests) i WHERE i ILIKE '%' || search_query || '%') THEN 'interests'
      WHEN p.notes ILIKE '%' || search_query || '%' THEN 'notes'
      ELSE 'name'
    END as match_type,
    CASE
      WHEN p.where_met ILIKE '%' || search_query || '%' THEN 'where_met'
      WHEN p.who_introduced ILIKE '%' || search_query || '%' THEN 'who_introduced'
      WHEN p.why_stay_in_contact ILIKE '%' || search_query || '%' THEN 'why_stay_in_contact'
      WHEN p.what_found_interesting ILIKE '%' || search_query || '%' THEN 'what_found_interesting'
      WHEN p.most_important_to_them ILIKE '%' || search_query || '%' THEN 'most_important_to_them'
      WHEN p.first_impression ILIKE '%' || search_query || '%' THEN 'first_impression'
      WHEN p.memorable_moment ILIKE '%' || search_query || '%' THEN 'memorable_moment'
      WHEN EXISTS (SELECT 1 FROM unnest(p.interests) i WHERE i ILIKE '%' || search_query || '%') THEN 'interests'
      ELSE 'name'
    END as match_field,
    similarity(COALESCE(p.name, ''), search_query) as relevance
  FROM persons p
  WHERE p.user_id = p_user_id
    AND p.archived = FALSE
    AND (
      p.name ILIKE '%' || search_query || '%'
      OR p.first_name ILIKE '%' || search_query || '%'
      OR p.last_name ILIKE '%' || search_query || '%'
      OR p.where_met ILIKE '%' || search_query || '%'
      OR p.who_introduced ILIKE '%' || search_query || '%'
      OR p.why_stay_in_contact ILIKE '%' || search_query || '%'
      OR p.what_found_interesting ILIKE '%' || search_query || '%'
      OR p.most_important_to_them ILIKE '%' || search_query || '%'
      OR p.first_impression ILIKE '%' || search_query || '%'
      OR p.memorable_moment ILIKE '%' || search_query || '%'
      OR p.notes ILIKE '%' || search_query || '%'
      OR EXISTS (SELECT 1 FROM unnest(p.interests) i WHERE i ILIKE '%' || search_query || '%')
    )
  ORDER BY p.id, relevance DESC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION search_persons_by_context IS 'Searches contacts by story context, not just name';

-- 9. Create view for contacts needing story completion
CREATE OR REPLACE VIEW incomplete_stories AS
SELECT
  p.id,
  p.user_id,
  p.first_name,
  p.last_name,
  p.name,
  p.photo_url,
  p.created_at,
  calculate_story_completeness(p.*) as completeness_score,
  ARRAY_REMOVE(ARRAY[
    CASE WHEN p.where_met IS NULL OR length(trim(p.where_met)) = 0 THEN 'where_met' END,
    CASE WHEN p.when_met IS NULL THEN 'when_met' END,
    CASE WHEN p.first_impression IS NULL OR length(trim(p.first_impression)) = 0 THEN 'first_impression' END,
    CASE WHEN p.why_stay_in_contact IS NULL OR length(trim(p.why_stay_in_contact)) < 30 THEN 'why_stay_in_contact' END,
    CASE WHEN p.what_found_interesting IS NULL OR length(trim(p.what_found_interesting)) < 30 THEN 'what_found_interesting' END,
    CASE WHEN p.most_important_to_them IS NULL OR length(trim(p.most_important_to_them)) < 30 THEN 'most_important_to_them' END,
    CASE WHEN p.memorable_moment IS NULL OR length(trim(p.memorable_moment)) = 0 THEN 'memorable_moment' END,
    CASE WHEN p.relationship_value IS NULL OR length(trim(p.relationship_value)) < 20 THEN 'relationship_value' END,
    CASE WHEN p.interests IS NULL OR array_length(p.interests, 1) = 0 THEN 'interests' END,
    CASE WHEN p.birthday IS NULL THEN 'birthday' END
  ], NULL) as missing_fields
FROM persons p
WHERE p.archived = FALSE
  AND calculate_story_completeness(p.*) < 80
ORDER BY p.created_at DESC;

COMMENT ON VIEW incomplete_stories IS 'Contacts with incomplete relationship stories';

-- 10. Update existing rows to set defaults
UPDATE persons SET archived = FALSE WHERE archived IS NULL;
UPDATE persons SET story_completeness = 0 WHERE story_completeness IS NULL;
