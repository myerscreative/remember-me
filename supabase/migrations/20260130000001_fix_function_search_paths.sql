-- Fix function search paths to prevent search path injection attacks
-- This migration adds SET search_path = '' to all functions that were missing it

-- ============================================
-- 1. deduplicate_family_members
-- ============================================
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
$$ LANGUAGE plpgsql
SET search_path = '';

-- ============================================
-- 2. merge_contacts (3-param version with security checks)
-- ============================================
CREATE OR REPLACE FUNCTION merge_contacts(keeper_id UUID, duplicate_id UUID, p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    dup_person public.persons%ROWTYPE;
    keeper_owner UUID;
    duplicate_owner UUID;
BEGIN
    -- SECURITY: Verify user owns the keeper contact
    SELECT user_id INTO keeper_owner FROM public.persons WHERE id = keeper_id;
    IF keeper_owner IS NULL THEN
        RAISE EXCEPTION 'Keeper contact not found';
    END IF;
    IF keeper_owner != p_user_id THEN
        RAISE EXCEPTION 'Unauthorized: You do not own the keeper contact';
    END IF;

    -- SECURITY: Verify user owns the duplicate contact
    SELECT user_id INTO duplicate_owner FROM public.persons WHERE id = duplicate_id;
    IF duplicate_owner IS NULL THEN
        RAISE EXCEPTION 'Duplicate contact not found';
    END IF;
    IF duplicate_owner != p_user_id THEN
        RAISE EXCEPTION 'Unauthorized: You do not own the duplicate contact';
    END IF;

    -- Get duplicate person data
    SELECT * INTO dup_person FROM public.persons WHERE id = duplicate_id;

    -- 1. Move Interactions
    UPDATE public.interactions
    SET person_id = keeper_id
    WHERE person_id = duplicate_id;

    -- 2. Move Contact Facts
    UPDATE public.contact_facts
    SET contact_id = keeper_id
    WHERE contact_id = duplicate_id;

    -- 3. Move Relationships (As A or B)
    UPDATE public.inter_contact_relationships
    SET contact_id_a = keeper_id
    WHERE contact_id_a = duplicate_id
    AND NOT EXISTS (
        SELECT 1 FROM public.inter_contact_relationships existing
        WHERE existing.contact_id_a = keeper_id
        AND existing.contact_id_b = public.inter_contact_relationships.contact_id_b
    );
    DELETE FROM public.inter_contact_relationships WHERE contact_id_a = duplicate_id;

    UPDATE public.inter_contact_relationships
    SET contact_id_b = keeper_id
    WHERE contact_id_b = duplicate_id
    AND NOT EXISTS (
        SELECT 1 FROM public.inter_contact_relationships existing
        WHERE existing.contact_id_b = keeper_id
        AND existing.contact_id_a = public.inter_contact_relationships.contact_id_a
    );
    DELETE FROM public.inter_contact_relationships WHERE contact_id_b = duplicate_id;

    -- 4. Move Interests
    INSERT INTO public.person_interests (person_id, interest_id)
    SELECT keeper_id, interest_id
    FROM public.person_interests
    WHERE person_id = duplicate_id
    ON CONFLICT DO NOTHING;

    DELETE FROM public.person_interests WHERE person_id = duplicate_id;

    -- 5. Move Tags
    INSERT INTO public.person_tags (person_id, tag_id)
    SELECT keeper_id, tag_id
    FROM public.person_tags
    WHERE person_id = duplicate_id
    ON CONFLICT DO NOTHING;

    DELETE FROM public.person_tags WHERE person_id = duplicate_id;

    -- 6. Update Keeper Fields
    UPDATE public.persons
    SET
        email = COALESCE(public.persons.email, dup_person.email),
        phone = COALESCE(public.persons.phone, dup_person.phone),
        photo_url = COALESCE(public.persons.photo_url, dup_person.photo_url),
        notes = COALESCE(public.persons.notes, '') || E'\n\n[Merged Notes]:\n' || COALESCE(dup_person.notes, ''),
        where_met = COALESCE(public.persons.where_met, dup_person.where_met),
        last_contact = GREATEST(public.persons.last_contact, dup_person.last_contact),
        interaction_count = public.persons.interaction_count + dup_person.interaction_count
    WHERE id = keeper_id;

    -- 7. Delete Duplicate
    DELETE FROM public.persons WHERE id = duplicate_id;
END;
$$;

-- ============================================
-- 3. update_has_context_trigger
-- ============================================
CREATE OR REPLACE FUNCTION update_has_context_trigger()
RETURNS TRIGGER AS $$
BEGIN
  NEW.has_context := public.calculate_has_context(NEW);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

-- ============================================
-- 4. update_user_stats
-- ============================================
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_stats (user_id, contacts_with_context, total_contacts, last_activity_date)
  VALUES (
    COALESCE(NEW.user_id, OLD.user_id),
    0,
    0,
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE public.user_stats
  SET
    total_contacts = (
      SELECT COUNT(*)
      FROM public.persons
      WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
        AND COALESCE(archive_status, FALSE) = FALSE
    ),
    contacts_with_context = (
      SELECT COUNT(*)
      FROM public.persons
      WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
        AND has_context = TRUE
        AND COALESCE(archive_status, FALSE) = FALSE
    ),
    last_activity_date = NOW(),
    updated_at = NOW()
  WHERE user_id = COALESCE(NEW.user_id, OLD.user_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql
SET search_path = '';

-- ============================================
-- 5. update_voice_memo_stats
-- ============================================
CREATE OR REPLACE FUNCTION update_voice_memo_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.attachment_type = 'voice_note' THEN
    UPDATE public.user_stats
    SET
      voice_memos_added = voice_memos_added + 1,
      last_activity_date = NOW(),
      updated_at = NOW()
    WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

-- ============================================
-- 6. get_contacts_needing_attention
-- ============================================
CREATE OR REPLACE FUNCTION get_contacts_needing_attention(
  p_user_id UUID,
  days_threshold INTEGER DEFAULT 30
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  last_interaction_date DATE,
  days_since_interaction INTEGER,
  contact_importance TEXT,
  relationship_summary TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.last_interaction_date,
    COALESCE(
      EXTRACT(DAY FROM (CURRENT_DATE - p.last_interaction_date))::INTEGER,
      EXTRACT(DAY FROM (CURRENT_DATE - p.created_at::DATE))::INTEGER
    ) as days_since,
    p.contact_importance,
    p.relationship_summary
  FROM public.persons p
  WHERE p.user_id = p_user_id
    AND COALESCE(p.archive_status, FALSE) = FALSE
    AND (
      p.last_interaction_date IS NULL
      OR p.last_interaction_date < CURRENT_DATE - days_threshold
    )
  ORDER BY
    CASE p.contact_importance
      WHEN 'high' THEN 1
      WHEN 'medium' THEN 2
      WHEN 'low' THEN 3
      ELSE 4
    END,
    p.last_interaction_date ASC NULLS FIRST;
END;
$$ LANGUAGE plpgsql STABLE
SET search_path = '';

-- ============================================
-- 7. search_persons_fulltext
-- ============================================
CREATE OR REPLACE FUNCTION search_persons_fulltext(
  p_user_id UUID,
  search_query TEXT
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  relationship_summary TEXT,
  photo_url TEXT,
  contact_importance TEXT,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.relationship_summary,
    p.photo_url,
    p.contact_importance,
    ts_rank(
      to_tsvector('english',
        COALESCE(p.name, '') || ' ' ||
        COALESCE(p.relationship_summary, '') || ' ' ||
        COALESCE(p.where_met, '') || ' ' ||
        COALESCE(p.who_introduced, '')
      ),
      plainto_tsquery('english', search_query)
    ) as search_rank
  FROM public.persons p
  WHERE p.user_id = p_user_id
    AND COALESCE(p.archive_status, FALSE) = FALSE
    AND (
      to_tsvector('english',
        COALESCE(p.name, '') || ' ' ||
        COALESCE(p.relationship_summary, '') || ' ' ||
        COALESCE(p.where_met, '') || ' ' ||
        COALESCE(p.who_introduced, '')
      ) @@ plainto_tsquery('english', search_query)
      OR p.name ILIKE '%' || search_query || '%'
    )
  ORDER BY search_rank DESC, p.name ASC;
END;
$$ LANGUAGE plpgsql STABLE
SET search_path = '';

-- ============================================
-- 8. insert_interaction
-- ============================================
CREATE OR REPLACE FUNCTION public.insert_interaction(
  p_person_id UUID,
  p_user_id UUID,
  p_interaction_type TEXT,
  p_interaction_date TIMESTAMPTZ,
  p_notes TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_interaction_id UUID;
BEGIN
  INSERT INTO public.interactions (
    person_id,
    user_id,
    type,
    date,
    notes
  ) VALUES (
    p_person_id,
    p_user_id,
    p_interaction_type,
    p_interaction_date,
    p_notes
  )
  RETURNING id INTO v_interaction_id;

  RETURN v_interaction_id;
END;
$$;

-- ============================================
-- 9. get_decaying_relationships
-- ============================================
CREATE OR REPLACE FUNCTION get_decaying_relationships(p_user_id UUID, days_threshold INTEGER)
RETURNS SETOF public.persons AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.persons
  WHERE user_id = p_user_id
    AND (archived IS FALSE OR archived IS NULL)
    AND (deleted_at IS NULL)
    AND (
      (last_interaction_date IS NOT NULL
       AND last_interaction_date < (NOW() - (COALESCE(target_frequency_days, 30) || ' days')::INTERVAL))
      OR
      (last_interaction_date IS NULL
       AND created_at < (NOW() - (COALESCE(target_frequency_days, 30) || ' days')::INTERVAL))
    )
  ORDER BY
    CASE
      WHEN last_interaction_date IS NOT NULL THEN
        EXTRACT(EPOCH FROM (NOW() - last_interaction_date)) / (COALESCE(target_frequency_days, 30) * 86400)
      ELSE
        EXTRACT(EPOCH FROM (NOW() - created_at)) / (COALESCE(target_frequency_days, 30) * 86400)
    END DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

-- ============================================
-- 10. update_person_interaction_stats
-- ============================================
CREATE OR REPLACE FUNCTION update_person_interaction_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.persons
    SET
      last_interaction_date = (
        SELECT MAX(date)
        FROM public.interactions
        WHERE person_id = NEW.person_id
      ),
      interaction_count = (
        SELECT COUNT(*)
        FROM public.interactions
        WHERE person_id = NEW.person_id
      )
    WHERE id = NEW.person_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.persons
    SET
      last_interaction_date = (
        SELECT MAX(date)
        FROM public.interactions
        WHERE person_id = OLD.person_id
      ),
      interaction_count = (
        SELECT COUNT(*)
        FROM public.interactions
        WHERE person_id = OLD.person_id
      )
    WHERE id = OLD.person_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql
SET search_path = '';

-- ============================================
-- 11. update_person_last_contact
-- ============================================
CREATE OR REPLACE FUNCTION update_person_last_contact()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.persons
  SET last_contact = NEW.date
  WHERE id = NEW.person_id
    AND (last_contact IS NULL OR last_contact < NEW.date);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

-- ============================================
-- 12. get_contacts_due_for_followup
-- ============================================
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
  FROM public.persons p
  WHERE p.user_id = p_user_id
    AND p.archived = FALSE
    AND p.next_contact_date IS NOT NULL
    AND p.next_contact_date <= CURRENT_DATE + days_ahead
  ORDER BY p.next_contact_date ASC, p.first_name ASC;
END;
$$ LANGUAGE plpgsql STABLE
SET search_path = '';

-- ============================================
-- 13. suggest_next_contact_date
-- ============================================
CREATE OR REPLACE FUNCTION suggest_next_contact_date(
  last_contact_date DATE,
  relationship_strength TEXT DEFAULT 'medium'
)
RETURNS DATE AS $$
DECLARE
  days_to_add INTEGER;
BEGIN
  days_to_add := CASE relationship_strength
    WHEN 'high' THEN 30
    WHEN 'medium' THEN 60
    WHEN 'low' THEN 90
    ELSE 60
  END;

  RETURN COALESCE(last_contact_date, CURRENT_DATE) + days_to_add;
END;
$$ LANGUAGE plpgsql IMMUTABLE
SET search_path = '';
