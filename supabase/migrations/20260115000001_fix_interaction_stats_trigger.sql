-- Fix update_person_interaction_stats function to use correct column name 'date' instead of 'interaction_date'

CREATE OR REPLACE FUNCTION update_person_interaction_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE persons
    SET
      last_interaction_date = (
        SELECT MAX(date)
        FROM interactions
        WHERE person_id = NEW.person_id
      ),
      interaction_count = (
        SELECT COUNT(*)
        FROM interactions
        WHERE person_id = NEW.person_id
      )
    WHERE id = NEW.person_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE persons
    SET
      last_interaction_date = (
        SELECT MAX(date)
        FROM interactions
        WHERE person_id = OLD.person_id
      ),
      interaction_count = (
        SELECT COUNT(*)
        FROM interactions
        WHERE person_id = OLD.person_id
      )
    WHERE id = OLD.person_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
