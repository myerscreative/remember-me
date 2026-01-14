-- Fix update_person_last_contact trigger function to use correct column name
-- The column was renamed from 'interaction_date' to 'date', but the function was not updated

CREATE OR REPLACE FUNCTION update_person_last_contact()
RETURNS TRIGGER AS $$
BEGIN
  -- Changed NEW.interaction_date to NEW.date
  UPDATE persons
  SET last_contact = NEW.date
  WHERE id = NEW.person_id
    AND (last_contact IS NULL OR last_contact < NEW.date);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
