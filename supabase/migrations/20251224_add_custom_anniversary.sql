-- Add custom_anniversary column to persons table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'persons' AND column_name = 'custom_anniversary') THEN
        ALTER TABLE persons ADD COLUMN custom_anniversary date;
    END IF;
END $$;
