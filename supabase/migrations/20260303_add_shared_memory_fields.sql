-- Migration: Add fields for Shared Memories and Relationship Health
-- This migration adds tracking for quick logs and explicit health status.

-- 1. Create HealthStatus enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'health_status') THEN
        CREATE TYPE public.health_status AS ENUM ('NURTURED', 'DRIFTING', 'NEGLECTED');
    END IF;
END $$;

-- 2. Add health_status to persons table
ALTER TABLE public.persons 
ADD COLUMN IF NOT EXISTS health_status public.health_status DEFAULT 'NURTURED';

-- 3. Add is_quick_log to shared_memories table
ALTER TABLE public.shared_memories
ADD COLUMN IF NOT EXISTS is_quick_log BOOLEAN DEFAULT true;

-- 4. Ensure last_contacted_at exists (matching Prisma suggestion, though app uses last_interaction_date)
-- We will keep using last_interaction_date as the primary source, but add this if the user specifically needs it for Prisma compatibility or future logic.
-- Actually, let's just stick to updating the existing 'last_interaction_date' and 'last_contact' in the action.
