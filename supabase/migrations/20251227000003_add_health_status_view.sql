-- Migration to add target_frequency_days and create person_health_status view

-- 1. Add target_frequency_days to persons if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='persons' AND column_name='target_frequency_days') THEN
        ALTER TABLE public.persons ADD COLUMN target_frequency_days INTEGER;
    END IF;
END $$;

-- 2. Create or replace the health status view
CREATE OR REPLACE VIEW person_health_status AS
WITH last_interactions AS (
    -- Using 'interaction_date' from interactions table
    SELECT person_id, MAX(interaction_date) as last_contact 
    FROM interactions
    GROUP BY person_id
)
SELECT 
    p.id,
    p.name,
    p.target_frequency_days,
    li.last_contact,
    CASE 
        -- If no frequency is set, default to 30 days for calculation
        WHEN li.last_contact IS NULL THEN 'neglected' 
        WHEN (CURRENT_DATE - li.last_contact::date) <= COALESCE(p.target_frequency_days, 30) THEN 'nurtured'
        WHEN (CURRENT_DATE - li.last_contact::date) <= (COALESCE(p.target_frequency_days, 30) * 1.2) THEN 'drifting'
        ELSE 'neglected'
    END as current_health
FROM persons p
LEFT JOIN last_interactions li ON p.id = li.person_id;
