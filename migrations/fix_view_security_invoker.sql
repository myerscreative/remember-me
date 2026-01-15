-- Fix security warnings: SECURITY DEFINER on views and mutable search_path on functions
-- This migration:
-- 1. Updates views to use SECURITY INVOKER instead of SECURITY DEFINER
-- 2. Adds explicit search_path to all functions to prevent search path attacks

-- ============================================
-- FIX VIEWS: Add SECURITY INVOKER
-- ============================================

-- Drop existing views first to avoid column mismatch errors
DROP VIEW IF EXISTS persons_with_tags;
DROP VIEW IF EXISTS person_interaction_counts;

-- Recreate persons_with_tags view with SECURITY INVOKER
CREATE VIEW persons_with_tags
WITH (security_invoker = true)
AS
SELECT 
  p.*,
  array_agg(t.name) FILTER (WHERE t.name IS NOT NULL) as tag_names,
  array_agg(t.color) FILTER (WHERE t.color IS NOT NULL) as tag_colors
FROM persons p
LEFT JOIN person_tags pt ON p.id = pt.person_id
LEFT JOIN tags t ON pt.tag_id = t.id
GROUP BY p.id;

-- Recreate person_interaction_counts view with SECURITY INVOKER
CREATE VIEW person_interaction_counts
WITH (security_invoker = true)
AS
SELECT
  person_id,
  COUNT(*) as total_interactions,
  MAX(date) as last_interaction_date,  -- Fixed: changed from interaction_date to date
  COUNT(*) FILTER (WHERE type = 'meeting') as meeting_count,  -- Fixed: changed from interaction_type to type
  COUNT(*) FILTER (WHERE type = 'call') as call_count,
  COUNT(*) FILTER (WHERE type = 'email') as email_count
FROM interactions
GROUP BY person_id;

-- ============================================
-- FIX FUNCTIONS: Add explicit search_path
-- ============================================

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

-- Fix update_person_last_contact function
CREATE OR REPLACE FUNCTION update_person_last_contact()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE persons
  SET last_contact = NEW.date  -- Fixed: changed from NEW.interaction_date to NEW.date
  WHERE id = NEW.person_id
    AND (last_contact IS NULL OR last_contact < NEW.date);  -- Fixed: changed from interaction_date to date
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

-- Fix search_persons function
CREATE OR REPLACE FUNCTION search_persons(
  search_query TEXT,
  current_user_id UUID
)
RETURNS SETOF persons AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM persons
  WHERE user_id = current_user_id
    AND (
      to_tsvector('english', 
        coalesce(name, '') || ' ' || 
        coalesce(first_name, '') || ' ' ||
        coalesce(last_name, '') || ' ' ||
        coalesce(email, '') || ' ' || 
        coalesce(notes, '') || ' ' || 
        coalesce(where_met, '')
      ) @@ plainto_tsquery('english', search_query)
      OR name ILIKE '%' || search_query || '%'
      OR first_name ILIKE '%' || search_query || '%'
      OR last_name ILIKE '%' || search_query || '%'
      OR email ILIKE '%' || search_query || '%'
    )
  ORDER BY 
    CASE 
      WHEN name ILIKE search_query || '%' THEN 1
      WHEN first_name ILIKE search_query || '%' THEN 1
      WHEN name ILIKE '%' || search_query || '%' THEN 2
      WHEN first_name ILIKE '%' || search_query || '%' THEN 2
      ELSE 3
    END,
    name;
END;
$$ LANGUAGE plpgsql STABLE
SET search_path = '';

-- Fix get_follow_up_reminders function
CREATE OR REPLACE FUNCTION get_follow_up_reminders(
  current_user_id UUID
)
RETURNS SETOF persons AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM persons
  WHERE user_id = current_user_id
    AND follow_up_reminder IS NOT NULL
    AND follow_up_reminder <= timezone('utc'::text, now())
  ORDER BY follow_up_reminder ASC;
END;
$$ LANGUAGE plpgsql STABLE
SET search_path = '';

-- Fix calculate_has_context function
CREATE OR REPLACE FUNCTION calculate_has_context(person persons)
RETURNS BOOLEAN AS $$
BEGIN
  -- Contact has context if they have meaningful information beyond just name/contact info
  RETURN (
    (person.where_met IS NOT NULL AND LENGTH(TRIM(person.where_met)) > 0)
    OR (person.who_introduced IS NOT NULL AND LENGTH(TRIM(person.who_introduced)) > 0)
    OR (person.why_stay_in_contact IS NOT NULL AND LENGTH(TRIM(person.why_stay_in_contact)) > 10)
    OR (person.what_found_interesting IS NOT NULL AND LENGTH(TRIM(person.what_found_interesting)) > 10)
    OR (person.relationship_summary IS NOT NULL AND LENGTH(TRIM(person.relationship_summary)) > 10)
    OR (person.interests IS NOT NULL AND array_length(person.interests, 1) > 0)
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE
SET search_path = '';

