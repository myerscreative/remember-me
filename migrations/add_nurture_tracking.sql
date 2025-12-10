-- ============================================
-- ReMember Me - Nurture/Next Contact Tracking
-- ============================================
-- Adds fields for tracking when to reach out next to maintain relationships

-- 1. Add next contact date and reason
ALTER TABLE persons
  ADD COLUMN IF NOT EXISTS next_contact_date DATE,
  ADD COLUMN IF NOT EXISTS next_contact_reason TEXT,
  ADD COLUMN IF NOT EXISTS last_contacted_date DATE;

COMMENT ON COLUMN persons.next_contact_date IS 'Date to reach out next to nurture this relationship';
COMMENT ON COLUMN persons.next_contact_reason IS 'Optional note about why/what to discuss on next contact';
COMMENT ON COLUMN persons.last_contacted_date IS 'Last date of meaningful contact (separate from last_contact timestamp)';

-- 2. Create index for next contact date queries
CREATE INDEX IF NOT EXISTS idx_persons_next_contact ON persons(user_id, next_contact_date) WHERE next_contact_date IS NOT NULL AND archived = FALSE;

-- 3. Create function to get contacts due for follow-up
CREATE OR REPLACE FUNCTION get_contacts_due_for_followup(
  p_user_id UUID,
  days_ahead INTEGER DEFAULT 7
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  first_name TEXT,
  last_name TEXT,
  photo_url TEXT,
  next_contact_date DATE,
  next_contact_reason TEXT,
  days_until_contact INTEGER,
  urgency TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.first_name,
    p.last_name,
    p.photo_url,
    p.next_contact_date,
    p.next_contact_reason,
    (p.next_contact_date - CURRENT_DATE)::INTEGER as days_until,
    CASE
      WHEN p.next_contact_date < CURRENT_DATE THEN 'overdue'
      WHEN p.next_contact_date = CURRENT_DATE THEN 'today'
      WHEN p.next_contact_date <= CURRENT_DATE + 3 THEN 'urgent'
      WHEN p.next_contact_date <= CURRENT_DATE + 7 THEN 'soon'
      ELSE 'upcoming'
    END as urgency_level
  FROM persons p
  WHERE p.user_id = p_user_id
    AND p.archived = FALSE
    AND p.next_contact_date IS NOT NULL
    AND p.next_contact_date <= CURRENT_DATE + days_ahead
  ORDER BY p.next_contact_date ASC, p.first_name ASC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_contacts_due_for_followup IS 'Returns contacts that need follow-up within specified days';

-- 4. Create function to suggest next contact date based on last interaction
CREATE OR REPLACE FUNCTION suggest_next_contact_date(
  last_contact_date DATE,
  relationship_strength TEXT DEFAULT 'medium'
)
RETURNS DATE AS $$
DECLARE
  days_to_add INTEGER;
BEGIN
  -- Suggest different intervals based on relationship strength
  days_to_add := CASE relationship_strength
    WHEN 'high' THEN 30    -- Close contacts: monthly
    WHEN 'medium' THEN 60  -- Regular contacts: every 2 months
    WHEN 'low' THEN 90     -- Occasional contacts: quarterly
    ELSE 60                -- Default: 2 months
  END;
  
  RETURN COALESCE(last_contact_date, CURRENT_DATE) + days_to_add;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION suggest_next_contact_date IS 'Suggests when to reach out next based on relationship strength';

-- 5. Create view for nurture dashboard
CREATE OR REPLACE VIEW nurture_dashboard AS
SELECT
  p.id,
  p.user_id,
  p.first_name,
  p.last_name,
  p.name,
  p.photo_url,
  p.email,
  p.phone,
  p.next_contact_date,
  p.next_contact_reason,
  p.last_contacted_date,
  p.last_contact,
  (p.next_contact_date - CURRENT_DATE)::INTEGER as days_until_contact,
  CASE
    WHEN p.next_contact_date < CURRENT_DATE THEN 'overdue'
    WHEN p.next_contact_date = CURRENT_DATE THEN 'today'
    WHEN p.next_contact_date <= CURRENT_DATE + 3 THEN 'urgent'
    WHEN p.next_contact_date <= CURRENT_DATE + 7 THEN 'soon'
    ELSE 'upcoming'
  END as urgency,
  CASE
    WHEN p.last_contacted_date IS NULL THEN 'never'
    WHEN CURRENT_DATE - p.last_contacted_date < 30 THEN 'recent'
    WHEN CURRENT_DATE - p.last_contacted_date < 90 THEN 'moderate'
    ELSE 'long_ago'
  END as recency
FROM persons p
WHERE p.archived = FALSE
  AND p.next_contact_date IS NOT NULL
ORDER BY p.next_contact_date ASC;

COMMENT ON VIEW nurture_dashboard IS 'Dashboard view for managing relationship nurturing';

