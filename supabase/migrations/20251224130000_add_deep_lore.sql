-- Migration to add deep_lore to persons table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='persons' AND column_name='deep_lore') THEN
        ALTER TABLE public.persons ADD COLUMN deep_lore TEXT;
    END IF;
END $$;
