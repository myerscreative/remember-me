-- Default cadence to 30 (Monthly) for new contacts
-- Ensures Health Logic has a clean baseline when cadence is not specified
-- Application layer also sets this explicitly; DB default is belt-and-suspenders

ALTER TABLE public.persons
  ALTER COLUMN target_frequency_days SET DEFAULT 30;

COMMENT ON COLUMN public.persons.target_frequency_days IS 'Target days between contacts; default 30 (Monthly)';
