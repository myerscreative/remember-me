-- ============================================
-- ReMember Me - Phase 1 Database Migration
-- ============================================
-- This migration adds critical fields for relationship tracking,
-- gamification, and performance improvements
--
-- New Features:
-- 1. Relationship health tracking (last_interaction_date, interaction_count)
-- 2. AI-powered summaries (relationship_summary)
-- 3. Contact importance prioritization
-- 4. Import tracking (imported, has_context flags)
-- 5. User engagement stats (user_stats table)
-- 6. Performance indexes for fast search
-- ============================================

-- ============================================
-- PART 1: Add New Fields to persons Table
-- ============================================

-- Add relationship summary field for AI-generated context
ALTER TABLE persons
  ADD COLUMN IF NOT EXISTS relationship_summary TEXT;

COMMENT ON COLUMN persons.relationship_summary IS 'AI-generated one-sentence context (e.g., "Met through John at AI Summit. Startup UX expert.")';

-- Add last interaction tracking (denormalized from interactions table for performance)
ALTER TABLE persons
  ADD COLUMN IF NOT EXISTS last_interaction_date DATE;

COMMENT ON COLUMN persons.last_interaction_date IS 'Date of most recent interaction (auto-updated via trigger)';

-- Add interaction count (denormalized for quick access)
ALTER TABLE persons
  ADD COLUMN IF NOT EXISTS interaction_count INTEGER DEFAULT 0;

COMMENT ON COLUMN persons.interaction_count IS 'Total number of logged interactions (auto-updated via trigger)';

-- Add contact importance/priority field
ALTER TABLE persons
  ADD COLUMN IF NOT EXISTS contact_importance TEXT CHECK (contact_importance IN ('high', 'medium', 'low'));

COMMENT ON COLUMN persons.contact_importance IS 'User-assigned priority level for this contact';

-- Add archive status flag (if not already exists from previous migration)
-- This is safe to run even if the column exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'persons' AND column_name = 'archive_status') THEN
        ALTER TABLE persons ADD COLUMN archive_status BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

COMMENT ON COLUMN persons.archive_status IS 'Whether this contact is archived (soft delete)';

-- Add context tracking flags
ALTER TABLE persons
  ADD COLUMN IF NOT EXISTS has_context BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN persons.has_context IS 'Whether meaningful context has been added (auto-calculated)';

-- Add import tracking flag
ALTER TABLE persons
  ADD COLUMN IF NOT EXISTS imported BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN persons.imported IS 'Whether this contact was imported (vs. manually added)';

-- ============================================
-- PART 2: Create user_stats Table
-- ============================================

CREATE TABLE IF NOT EXISTS user_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contacts_with_context INTEGER DEFAULT 0,
  total_contacts INTEGER DEFAULT 0,
  voice_memos_added INTEGER DEFAULT 0,
  last_activity_date TIMESTAMP WITH TIME ZONE,
  streak_days INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

COMMENT ON TABLE user_stats IS 'User engagement and gamification statistics';
COMMENT ON COLUMN user_stats.contacts_with_context IS 'Number of contacts with meaningful context added';
COMMENT ON COLUMN user_stats.total_contacts IS 'Total number of contacts (excluding archived)';
COMMENT ON COLUMN user_stats.voice_memos_added IS 'Total voice memos/attachments added';
COMMENT ON COLUMN user_stats.last_activity_date IS 'Last time user added/updated any data';
COMMENT ON COLUMN user_stats.streak_days IS 'Current consecutive days with activity';

-- Enable RLS on user_stats
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own stats
CREATE POLICY "Users can view own stats"
  ON user_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stats"
  ON user_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stats"
  ON user_stats FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- PART 3: Create Performance Indexes
-- ============================================

-- Composite index for user + name sorting (makes contact list loading instant)
CREATE INDEX IF NOT EXISTS idx_persons_user_name
  ON persons(user_id, name);

-- Index for finding overdue contacts (relationship health tracking)
CREATE INDEX IF NOT EXISTS idx_persons_last_interaction
  ON persons(user_id, last_interaction_date)
  WHERE archive_status = FALSE;

-- Full-text search index (GIN = 10-100x faster than LIKE queries)
CREATE INDEX IF NOT EXISTS idx_persons_search
  ON persons USING GIN (
    to_tsvector('english',
      COALESCE(name, '') || ' ' ||
      COALESCE(relationship_summary, '') || ' ' ||
      COALESCE(where_met, '') || ' ' ||
      COALESCE(who_introduced, '')
    )
  );

-- Index for importance filtering
CREATE INDEX IF NOT EXISTS idx_persons_importance
  ON persons(user_id, contact_importance)
  WHERE contact_importance IS NOT NULL AND archive_status = FALSE;

-- Index for imported contacts
CREATE INDEX IF NOT EXISTS idx_persons_imported
  ON persons(user_id, imported, has_context)
  WHERE imported = TRUE AND archive_status = FALSE;

-- ============================================
-- PART 4: Create Trigger Functions
-- ============================================

-- Function to calculate has_context flag automatically
CREATE OR REPLACE FUNCTION calculate_has_context(person persons)
RETURNS BOOLEAN AS $$
BEGIN
  -- Contact has context if they have meaningful information beyond just name/contact info
  RETURN (
    (person.where_met IS NOT NULL AND LENGTH(TRIM(person.where_met)) > 0)
    OR (person.who_introduced IS NOT NULL AND LENGTH(TRIM(person.who_introduced)) > 0)
    OR (person.why_stay_in_contact IS NOT NULL AND LENGTH(TRIM(person.why_stay_in_contact)) > 10)
    OR (person.what_found_interesting IS NOT NULL AND LENGTH(TRIM(person.what_found_interesting)) > 10)
    OR (person.relationship_summary IS NOT NULL AND LENGTH(TRIM(person.relationship_summary)) > 10)
    OR (person.interests IS NOT NULL AND array_length(person.interests, 1) > 0)
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to auto-update has_context flag
CREATE OR REPLACE FUNCTION update_has_context_trigger()
RETURNS TRIGGER AS $$
BEGIN
  NEW.has_context := calculate_has_context(NEW);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS persons_has_context_trigger ON persons;
CREATE TRIGGER persons_has_context_trigger
  BEFORE INSERT OR UPDATE ON persons
  FOR EACH ROW
  EXECUTE FUNCTION update_has_context_trigger();

-- Function to update user_stats when persons change
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Initialize stats row if it doesn't exist
  INSERT INTO user_stats (user_id, contacts_with_context, total_contacts, last_activity_date)
  VALUES (
    COALESCE(NEW.user_id, OLD.user_id),
    0,
    0,
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- Update stats
  UPDATE user_stats
  SET
    total_contacts = (
      SELECT COUNT(*)
      FROM persons
      WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
        AND COALESCE(archive_status, FALSE) = FALSE
    ),
    contacts_with_context = (
      SELECT COUNT(*)
      FROM persons
      WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
        AND has_context = TRUE
        AND COALESCE(archive_status, FALSE) = FALSE
    ),
    last_activity_date = NOW(),
    updated_at = NOW()
  WHERE user_id = COALESCE(NEW.user_id, OLD.user_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS persons_stats_trigger ON persons;
CREATE TRIGGER persons_stats_trigger
  AFTER INSERT OR UPDATE OR DELETE ON persons
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats();

-- Function to update person's interaction tracking when interactions are logged
CREATE OR REPLACE FUNCTION update_person_interaction_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE persons
    SET
      last_interaction_date = (
        SELECT MAX(interaction_date)
        FROM interactions
        WHERE person_id = NEW.person_id
      ),
      interaction_count = (
        SELECT COUNT(*)
        FROM interactions
        WHERE person_id = NEW.person_id
      )
    WHERE id = NEW.person_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE persons
    SET
      last_interaction_date = (
        SELECT MAX(interaction_date)
        FROM interactions
        WHERE person_id = OLD.person_id
      ),
      interaction_count = (
        SELECT COUNT(*)
        FROM interactions
        WHERE person_id = OLD.person_id
      )
    WHERE id = OLD.person_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS interactions_update_person_trigger ON interactions;
CREATE TRIGGER interactions_update_person_trigger
  AFTER INSERT OR UPDATE OR DELETE ON interactions
  FOR EACH ROW
  EXECUTE FUNCTION update_person_interaction_stats();

-- Function to track voice memo additions in user_stats
CREATE OR REPLACE FUNCTION update_voice_memo_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.attachment_type = 'voice_note' THEN
    UPDATE user_stats
    SET
      voice_memos_added = voice_memos_added + 1,
      last_activity_date = NOW(),
      updated_at = NOW()
    WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS attachments_stats_trigger ON attachments;
CREATE TRIGGER attachments_stats_trigger
  AFTER INSERT ON attachments
  FOR EACH ROW
  EXECUTE FUNCTION update_voice_memo_stats();

-- ============================================
-- PART 5: Backfill Existing Data
-- ============================================

-- Backfill has_context for existing contacts
UPDATE persons
SET has_context = calculate_has_context(persons.*)
WHERE has_context IS NULL OR has_context = FALSE;

-- Backfill interaction stats from existing interactions
UPDATE persons p
SET
  last_interaction_date = (
    SELECT MAX(interaction_date)
    FROM interactions i
    WHERE i.person_id = p.id
  ),
  interaction_count = (
    SELECT COUNT(*)
    FROM interactions i
    WHERE i.person_id = p.id
  )
WHERE EXISTS (
  SELECT 1 FROM interactions i WHERE i.person_id = p.id
);

-- Initialize user_stats for all existing users
INSERT INTO user_stats (user_id, contacts_with_context, total_contacts, voice_memos_added, last_activity_date)
SELECT DISTINCT
  p.user_id,
  COUNT(*) FILTER (WHERE p.has_context = TRUE),
  COUNT(*),
  COALESCE((
    SELECT COUNT(*)
    FROM attachments a
    WHERE a.user_id = p.user_id AND a.attachment_type = 'voice_note'
  ), 0),
  NOW()
FROM persons p
WHERE COALESCE(p.archive_status, FALSE) = FALSE
GROUP BY p.user_id
ON CONFLICT (user_id) DO UPDATE
SET
  contacts_with_context = EXCLUDED.contacts_with_context,
  total_contacts = EXCLUDED.total_contacts,
  voice_memos_added = EXCLUDED.voice_memos_added,
  updated_at = NOW();

-- ============================================
-- PART 6: Create Helper Functions
-- ============================================

-- Function to get contacts needing attention (no recent interactions)
CREATE OR REPLACE FUNCTION get_contacts_needing_attention(
  p_user_id UUID,
  days_threshold INTEGER DEFAULT 30
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  last_interaction_date DATE,
  days_since_interaction INTEGER,
  contact_importance TEXT,
  relationship_summary TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.last_interaction_date,
    COALESCE(
      EXTRACT(DAY FROM (CURRENT_DATE - p.last_interaction_date))::INTEGER,
      EXTRACT(DAY FROM (CURRENT_DATE - p.created_at::DATE))::INTEGER
    ) as days_since,
    p.contact_importance,
    p.relationship_summary
  FROM persons p
  WHERE p.user_id = p_user_id
    AND COALESCE(p.archive_status, FALSE) = FALSE
    AND (
      p.last_interaction_date IS NULL
      OR p.last_interaction_date < CURRENT_DATE - days_threshold
    )
  ORDER BY
    CASE p.contact_importance
      WHEN 'high' THEN 1
      WHEN 'medium' THEN 2
      WHEN 'low' THEN 3
      ELSE 4
    END,
    p.last_interaction_date ASC NULLS FIRST;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_contacts_needing_attention IS 'Returns contacts that haven''t been contacted recently, sorted by importance';

-- Function to search persons with new full-text search
CREATE OR REPLACE FUNCTION search_persons_fulltext(
  p_user_id UUID,
  search_query TEXT
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  relationship_summary TEXT,
  photo_url TEXT,
  contact_importance TEXT,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.relationship_summary,
    p.photo_url,
    p.contact_importance,
    ts_rank(
      to_tsvector('english',
        COALESCE(p.name, '') || ' ' ||
        COALESCE(p.relationship_summary, '') || ' ' ||
        COALESCE(p.where_met, '') || ' ' ||
        COALESCE(p.who_introduced, '')
      ),
      plainto_tsquery('english', search_query)
    ) as search_rank
  FROM persons p
  WHERE p.user_id = p_user_id
    AND COALESCE(p.archive_status, FALSE) = FALSE
    AND (
      to_tsvector('english',
        COALESCE(p.name, '') || ' ' ||
        COALESCE(p.relationship_summary, '') || ' ' ||
        COALESCE(p.where_met, '') || ' ' ||
        COALESCE(p.who_introduced, '')
      ) @@ plainto_tsquery('english', search_query)
      OR p.name ILIKE '%' || search_query || '%'
    )
  ORDER BY search_rank DESC, p.name ASC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION search_persons_fulltext IS 'Full-text search across person data with relevance ranking';

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify new columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'persons'
  AND column_name IN (
    'relationship_summary',
    'last_interaction_date',
    'interaction_count',
    'contact_importance',
    'archive_status',
    'has_context',
    'imported'
  )
ORDER BY column_name;

-- Verify user_stats table exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'user_stats'
ORDER BY ordinal_position;

-- Verify indexes were created
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'persons'
  AND indexname LIKE 'idx_persons_%'
ORDER BY indexname;

-- Show summary statistics
SELECT
  'Migration Complete!' as status,
  (SELECT COUNT(*) FROM persons) as total_contacts,
  (SELECT COUNT(*) FROM persons WHERE has_context = TRUE) as contacts_with_context,
  (SELECT COUNT(DISTINCT user_id) FROM user_stats) as users_with_stats,
  (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'persons') as indexes_on_persons;
