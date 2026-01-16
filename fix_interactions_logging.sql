-- =================================================================
-- COMPREHENSIVE FIX SCRIPT: INTERACTIONS TABLE
-- Run this in the Supabase SQL Editor to standardize the table.
-- =================================================================

BEGIN;

-- 1. FIX COLUMNS (Idempotent Renames)
-- Ensure we are using 'date' and 'type' as expected by the application code.
DO $$
BEGIN
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'interactions' AND column_name = 'interaction_date') THEN
        ALTER TABLE interactions RENAME COLUMN interaction_date TO date;
    END IF;
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'interactions' AND column_name = 'interaction_type') THEN
        ALTER TABLE interactions RENAME COLUMN interaction_type TO type;
    END IF;
END $$;

-- 2. FIX FUNCTIONS (Ensure they use correct 'date' column)
CREATE OR REPLACE FUNCTION update_person_last_contact()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the person's last_contact field using the new interaction's date
  UPDATE persons
  SET last_contact = NEW.date
  WHERE id = NEW.person_id
    AND (last_contact IS NULL OR last_contact < NEW.date);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_person_interaction_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE persons
        SET 
            last_interaction_date = (SELECT MAX(date) FROM interactions WHERE person_id = NEW.person_id),
            interaction_count = (SELECT COUNT(*) FROM interactions WHERE person_id = NEW.person_id)
        WHERE id = NEW.person_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE persons
        SET 
            last_interaction_date = (SELECT MAX(date) FROM interactions WHERE person_id = OLD.person_id),
            interaction_count = (SELECT COUNT(*) FROM interactions WHERE person_id = OLD.person_id)
        WHERE id = OLD.person_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 3. CLEAN UP TRIGGERS (Remove duplicates and old versions)
DROP TRIGGER IF EXISTS interactions_update_person_trigger ON interactions;
DROP TRIGGER IF EXISTS update_last_contact_on_interaction ON interactions;
DROP TRIGGER IF EXISTS update_person_last_contact_trigger ON interactions;
DROP TRIGGER IF EXISTS interactions_update_person_trigger_v2 ON interactions;
DROP TRIGGER IF EXISTS update_interactions_updated_at ON interactions;

-- 4. RE-CREATE TRIGGERS (Clean Slate)
-- Restore standard updated_at trigger
CREATE TRIGGER update_interactions_updated_at
BEFORE UPDATE ON interactions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update interaction stats on any change
CREATE TRIGGER update_stats_on_interaction
AFTER INSERT OR UPDATE OR DELETE ON interactions
FOR EACH ROW EXECUTE FUNCTION update_person_interaction_stats();

-- Update last contact date primarily on insert
CREATE TRIGGER update_last_contact_on_insert
AFTER INSERT ON interactions
FOR EACH ROW EXECUTE FUNCTION update_person_last_contact();

-- 5. FIX POLICIES (Reset Insert Permission)
DROP POLICY IF EXISTS "Users can insert own interactions" ON interactions;
CREATE POLICY "Users can insert own interactions" ON interactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

COMMIT;
