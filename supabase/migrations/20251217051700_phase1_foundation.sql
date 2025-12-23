-- Phase 1: Database Foundation & Decay Alerts
-- Idempotent migration to ensure all required fields and functions exist

-- 1. Alter persons table to add missing fields (if they don't exist)
DO $$ 
BEGIN 
    -- relationship_summary
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'persons' AND column_name = 'relationship_summary') THEN
        ALTER TABLE persons ADD COLUMN relationship_summary TEXT;
    END IF;

    -- last_interaction_date
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'persons' AND column_name = 'last_interaction_date') THEN
        ALTER TABLE persons ADD COLUMN last_interaction_date TIMESTAMPTZ;
    END IF;
    
    -- interaction_count
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'persons' AND column_name = 'interaction_count') THEN
        ALTER TABLE persons ADD COLUMN interaction_count INTEGER DEFAULT 0;
    END IF;

    -- contact_importance
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'persons' AND column_name = 'contact_importance') THEN
        ALTER TABLE persons ADD COLUMN contact_importance TEXT CHECK (contact_importance IN ('high', 'medium', 'low'));
    END IF;

    -- archive_status (soft delete distinct from 'archived' if needed, or unify)
    -- The types file shows both 'archived' and 'archive_status', let's ensure 'archived' is the main one and 'archive_status' is present if the code expects it.
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'persons' AND column_name = 'archive_status') THEN
        ALTER TABLE persons ADD COLUMN archive_status BOOLEAN DEFAULT false;
    END IF;
    
    -- archived (seems to be the primary one in some contexts)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'persons' AND column_name = 'archived') THEN
        ALTER TABLE persons ADD COLUMN archived BOOLEAN DEFAULT false;
    END IF;

    -- is_favorite
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'persons' AND column_name = 'is_favorite') THEN
        ALTER TABLE persons ADD COLUMN is_favorite BOOLEAN DEFAULT false;
    END IF;

    -- has_context
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'persons' AND column_name = 'has_context') THEN
        ALTER TABLE persons ADD COLUMN has_context BOOLEAN DEFAULT false;
    END IF;

    -- imported
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'persons' AND column_name = 'imported') THEN
        ALTER TABLE persons ADD COLUMN imported BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 2. Create user_stats table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    contacts_with_context INTEGER DEFAULT 0,
    total_contacts INTEGER DEFAULT 0,
    voice_memos_added INTEGER DEFAULT 0,
    last_activity_date TIMESTAMPTZ,
    streak_days INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on user_stats
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Create policy for user_stats (Users can only see/edit their own stats)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_stats' AND policyname = 'Users can view own stats') THEN
        CREATE POLICY "Users can view own stats" ON user_stats FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_stats' AND policyname = 'Users can update own stats') THEN
        CREATE POLICY "Users can update own stats" ON user_stats FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_stats' AND policyname = 'Users can insert own stats') THEN
        CREATE POLICY "Users can insert own stats" ON user_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- 3. Create Indexes for performance
CREATE INDEX IF NOT EXISTS idx_persons_user_name ON persons(user_id, name);
CREATE INDEX IF NOT EXISTS idx_persons_last_interaction ON persons(user_id, last_interaction_date);
-- GIN index for full text search (requires pg_trgm extension generally, but simple text search works without it for basic cases)
-- Check if extensions exist, otherwise skip complex index or create simple one
CREATE INDEX IF NOT EXISTS idx_persons_relationship_summary ON persons(relationship_summary); 


-- 4. Create the RPC function for Decay Alerts
CREATE OR REPLACE FUNCTION get_decaying_relationships(p_user_id UUID, days_threshold INTEGER)
RETURNS SETOF persons AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM persons
  WHERE user_id = p_user_id
    AND (archived IS FALSE OR archived IS NULL)
    AND (
      last_interaction_date < (NOW() - (days_threshold || ' days')::INTERVAL)
      OR 
      (last_interaction_date IS NULL AND created_at < (NOW() - (days_threshold || ' days')::INTERVAL))
    )
  ORDER BY last_interaction_date ASC NULLS FIRST
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
