-- Migration to add important_dates to persons table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='persons' AND column_name='important_dates') THEN
        ALTER TABLE public.persons ADD COLUMN important_dates JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;
