-- Security fixes for merge_contacts RPC and relationships RLS policies
-- This migration addresses two security gaps:
-- 1. merge_contacts() function didn't verify user ownership of contacts
-- 2. relationships UPDATE/DELETE policies only checked from_person_id

-- ============================================
-- FIX 1: Update merge_contacts() to require user ownership verification
-- ============================================

CREATE OR REPLACE FUNCTION merge_contacts(keeper_id UUID, duplicate_id UUID, p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    dup_person persons%ROWTYPE;
    keeper_owner UUID;
    duplicate_owner UUID;
BEGIN
    -- SECURITY: Verify user owns the keeper contact
    SELECT user_id INTO keeper_owner FROM persons WHERE id = keeper_id;
    IF keeper_owner IS NULL THEN
        RAISE EXCEPTION 'Keeper contact not found';
    END IF;
    IF keeper_owner != p_user_id THEN
        RAISE EXCEPTION 'Unauthorized: You do not own the keeper contact';
    END IF;

    -- SECURITY: Verify user owns the duplicate contact
    SELECT user_id INTO duplicate_owner FROM persons WHERE id = duplicate_id;
    IF duplicate_owner IS NULL THEN
        RAISE EXCEPTION 'Duplicate contact not found';
    END IF;
    IF duplicate_owner != p_user_id THEN
        RAISE EXCEPTION 'Unauthorized: You do not own the duplicate contact';
    END IF;

    -- Get duplicate person data
    SELECT * INTO dup_person FROM persons WHERE id = duplicate_id;

    -- 1. Move Interactions
    UPDATE interactions
    SET person_id = keeper_id
    WHERE person_id = duplicate_id;

    -- 2. Move Contact Facts
    UPDATE contact_facts
    SET contact_id = keeper_id
    WHERE contact_id = duplicate_id;

    -- 3. Move Relationships (As A or B)
    -- Relationships where duplicate is A
    UPDATE inter_contact_relationships
    SET contact_id_a = keeper_id
    WHERE contact_id_a = duplicate_id
    AND NOT EXISTS (
        SELECT 1 FROM inter_contact_relationships existing
        WHERE existing.contact_id_a = keeper_id
        AND existing.contact_id_b = inter_contact_relationships.contact_id_b
    );
    -- Delete remaining (conflicts)
    DELETE FROM inter_contact_relationships WHERE contact_id_a = duplicate_id;

    -- Relationships where duplicate is B
    UPDATE inter_contact_relationships
    SET contact_id_b = keeper_id
    WHERE contact_id_b = duplicate_id
    AND NOT EXISTS (
        SELECT 1 FROM inter_contact_relationships existing
        WHERE existing.contact_id_b = keeper_id
        AND existing.contact_id_a = inter_contact_relationships.contact_id_a
    );
    -- Delete remaining (conflicts)
    DELETE FROM inter_contact_relationships WHERE contact_id_b = duplicate_id;

    -- 4. Move Interests
    INSERT INTO person_interests (person_id, interest_id)
    SELECT keeper_id, interest_id
    FROM person_interests
    WHERE person_id = duplicate_id
    ON CONFLICT DO NOTHING;

    DELETE FROM person_interests WHERE person_id = duplicate_id;

    -- 5. Move Tags
    INSERT INTO person_tags (person_id, tag_id)
    SELECT keeper_id, tag_id
    FROM person_tags
    WHERE person_id = duplicate_id
    ON CONFLICT DO NOTHING;

    DELETE FROM person_tags WHERE person_id = duplicate_id;

    -- 6. Update Keeper Fields (Fill in missing info)
    UPDATE persons
    SET
        email = COALESCE(persons.email, dup_person.email),
        phone = COALESCE(persons.phone, dup_person.phone),
        photo_url = COALESCE(persons.photo_url, dup_person.photo_url),
        notes = COALESCE(persons.notes, '') || E'\n\n[Merged Notes]:\n' || COALESCE(dup_person.notes, ''),
        where_met = COALESCE(persons.where_met, dup_person.where_met),
        last_contact = GREATEST(persons.last_contact, dup_person.last_contact),
        interaction_count = persons.interaction_count + dup_person.interaction_count
    WHERE id = keeper_id;

    -- 7. Delete Duplicate
    DELETE FROM persons WHERE id = duplicate_id;

END;
$$;

-- ============================================
-- FIX 2: Update relationships RLS policies to check both person IDs
-- ============================================

-- Drop existing UPDATE and DELETE policies
DROP POLICY IF EXISTS "Users can update their own relationships" ON relationships;
DROP POLICY IF EXISTS "Users can delete their own relationships" ON relationships;

-- Recreate UPDATE policy: verify user owns BOTH persons
CREATE POLICY "Users can update their own relationships"
  ON relationships FOR UPDATE
  USING (
    -- User must own from_person_id in the existing row
    EXISTS (
      SELECT 1 FROM persons
      WHERE persons.id = relationships.from_person_id
      AND persons.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM persons
      WHERE persons.id = relationships.to_person_id
      AND persons.user_id = auth.uid()
    )
  )
  WITH CHECK (
    -- User must own both persons in the new values
    EXISTS (
      SELECT 1 FROM persons
      WHERE persons.id = relationships.from_person_id
      AND persons.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM persons
      WHERE persons.id = relationships.to_person_id
      AND persons.user_id = auth.uid()
    )
  );

-- Recreate DELETE policy: verify user owns BOTH persons
CREATE POLICY "Users can delete their own relationships"
  ON relationships FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM persons
      WHERE persons.id = relationships.from_person_id
      AND persons.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM persons
      WHERE persons.id = relationships.to_person_id
      AND persons.user_id = auth.uid()
    )
  );
