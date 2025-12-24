-- Add company and job_title columns to persons table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'persons' AND column_name = 'company') THEN
        ALTER TABLE persons ADD COLUMN company TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'persons' AND column_name = 'job_title') THEN
        ALTER TABLE persons ADD COLUMN job_title TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'persons' AND column_name = 'deep_lore') THEN
        ALTER TABLE persons ADD COLUMN deep_lore TEXT;
    END IF;
END $$;

NOTIFY pgrst, 'reload schema';
