-- Update RPC function to merge two contacts including person_tags
CREATE OR REPLACE FUNCTION merge_contacts(keeper_id UUID, duplicate_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    dup_person persons%ROWTYPE;
BEGIN
    -- get duplicate person data
    SELECT * INTO dup_person FROM persons WHERE id = duplicate_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Duplicate contact not found';
    END IF;

    -- 1. Move Interactions
    UPDATE interactions 
    SET person_id = keeper_id 
    WHERE person_id = duplicate_id;

    -- 2. Move Meetings - REMOVED (Table does not exist, covered by interactions)
    -- UPDATE meetings SET contact_id = keeper_id WHERE contact_id = duplicate_id;

    -- 3. Move Contact Facts
    UPDATE contact_facts 
    SET contact_id = keeper_id 
    WHERE contact_id = duplicate_id;

    -- 4. Move Relationships (As A or B)
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

    -- 5. Move Interests
    -- Insert interests from duplicate that keeper doesn't have
    INSERT INTO person_interests (person_id, interest_id)
    SELECT keeper_id, interest_id
    FROM person_interests
    WHERE person_id = duplicate_id
    ON CONFLICT DO NOTHING;
    
    -- Delete duplicate's interests
    DELETE FROM person_interests WHERE person_id = duplicate_id;

    -- 5b. Move Tags (New Step)
    -- Insert tags from duplicate that keeper doesn't have
    INSERT INTO person_tags (person_id, tag_id)
    SELECT keeper_id, tag_id
    FROM person_tags
    WHERE person_id = duplicate_id
    ON CONFLICT DO NOTHING;

    -- Delete duplicate's tags
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
