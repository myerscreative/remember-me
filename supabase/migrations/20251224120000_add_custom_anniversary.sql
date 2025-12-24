-- Migration to add custom_anniversary to persons table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='persons' AND column_name='custom_anniversary') THEN
        ALTER TABLE public.persons ADD COLUMN custom_anniversary DATE;
    END IF;
END $$;
