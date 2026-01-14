-- FIX: Update the trigger function to use the correct 'date' column
-- Run this in your Supabase Dashboard > SQL Editor

CREATE OR REPLACE FUNCTION update_person_last_contact()
RETURNS TRIGGER AS $$
BEGIN
  -- We changed 'interaction_date' to 'date', so we must update the reference here.
  -- OLD: NEW.interaction_date
  -- NEW: NEW.date
  UPDATE persons
  SET last_contact = NEW.date
  WHERE id = NEW.person_id
    AND (last_contact IS NULL OR last_contact < NEW.date);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
