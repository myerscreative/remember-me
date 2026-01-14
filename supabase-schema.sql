-- ============================================
-- ReMember Me - Complete Supabase Schema
-- ============================================
-- Run this entire file in Supabase SQL Editor
-- This creates all tables, policies, indexes, and triggers

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search

-- ============================================
-- 1. PERSONS TABLE
-- ============================================
-- Main table for storing contact information

CREATE TABLE persons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Basic Information
  name TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT,
  photo_url TEXT,
  phone TEXT,
  email TEXT,
  linkedin TEXT,
  birthday DATE,
  family_members JSONB DEFAULT '[]'::jsonb,
  
  -- Connection Context
  where_met TEXT,
  who_introduced TEXT,
  when_met DATE,
  
  -- Relationship Insights
  why_stay_in_contact TEXT,
  what_found_interesting TEXT,
  most_important_to_them TEXT,
  interests TEXT[], -- Array of interest tags
  
  -- Personal Notes
  family_notes TEXT,
  notes TEXT,
  
  -- Contact Tracking
  last_contact TIMESTAMP WITH TIME ZONE,
  follow_up_reminder TIMESTAMP WITH TIME ZONE,
  next_contact_date DATE,
  next_contact_reason TEXT,
  last_contacted_date DATE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Constraints
  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR email IS NULL),
  CONSTRAINT name_not_empty CHECK (length(trim(name)) > 0),
  CONSTRAINT first_name_not_empty CHECK (length(trim(first_name)) > 0)
);

-- Add comment for documentation
COMMENT ON TABLE persons IS 'Stores all contact/person information for users';
COMMENT ON COLUMN persons.first_name IS 'First name of the contact';
COMMENT ON COLUMN persons.last_name IS 'Last name of the contact (optional)';
COMMENT ON COLUMN persons.family_members IS 'Array of family member objects with name and relationship fields';

-- ============================================
-- 2. TAGS TABLE
-- ============================================
-- User-defined tags for categorizing contacts

CREATE TABLE tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#8b5cf6', -- Default purple color
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Ensure unique tag names per user
  CONSTRAINT unique_tag_per_user UNIQUE (user_id, name),
  CONSTRAINT tag_name_not_empty CHECK (length(trim(name)) > 0),
  CONSTRAINT valid_color_format CHECK (color ~* '^#[0-9A-Fa-f]{6}$')
);

COMMENT ON TABLE tags IS 'User-defined tags for organizing contacts';

-- ============================================
-- 3. PERSON_TAGS JUNCTION TABLE
-- ============================================
-- Many-to-many relationship between persons and tags

CREATE TABLE person_tags (
  person_id UUID REFERENCES persons(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  PRIMARY KEY (person_id, tag_id)
);

COMMENT ON TABLE person_tags IS 'Junction table linking persons to tags';

-- ============================================
-- 4. RELATIONSHIPS TABLE
-- ============================================
-- Defines how contacts are related to each other

CREATE TABLE relationships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_person_id UUID REFERENCES persons(id) ON DELETE CASCADE NOT NULL,
  to_person_id UUID REFERENCES persons(id) ON DELETE CASCADE NOT NULL,
  relationship_type TEXT NOT NULL, -- e.g., 'colleague', 'friend', 'family', 'mentor'
  context TEXT, -- Additional context about the relationship
  direction TEXT DEFAULT 'bidirectional', -- 'bidirectional', 'from_to', 'to_from'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Prevent self-relationships
  CONSTRAINT no_self_relationship CHECK (from_person_id != to_person_id),
  -- Prevent duplicate relationships
  CONSTRAINT unique_relationship UNIQUE (from_person_id, to_person_id),
  CONSTRAINT valid_direction CHECK (direction IN ('bidirectional', 'from_to', 'to_from'))
);

COMMENT ON TABLE relationships IS 'Defines relationships between contacts';

-- ============================================
-- 5. ATTACHMENTS TABLE
-- ============================================
-- For storing voice notes, documents, and other files

CREATE TABLE attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  person_id UUID REFERENCES persons(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- File Information
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL, -- Supabase Storage URL
  file_type TEXT NOT NULL, -- MIME type: 'audio/mpeg', 'application/pdf', etc.
  file_size BIGINT, -- Size in bytes
  
  -- Attachment Metadata
  attachment_type TEXT NOT NULL, -- 'voice_note', 'document', 'image', 'other'
  title TEXT,
  description TEXT,
  transcription TEXT, -- For voice notes (can be added via AI)
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  CONSTRAINT valid_attachment_type CHECK (attachment_type IN ('voice_note', 'document', 'image', 'other')),
  CONSTRAINT file_name_not_empty CHECK (length(trim(file_name)) > 0)
);

COMMENT ON TABLE attachments IS 'Stores files, voice notes, and documents related to contacts';

-- ============================================
-- 6. INTERACTIONS TABLE
-- ============================================
-- Track interactions/meetings with contacts

CREATE TABLE interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  person_id UUID REFERENCES persons(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  interaction_type TEXT NOT NULL, -- 'meeting', 'call', 'email', 'message', 'other'
  interaction_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  title TEXT,
  notes TEXT,
  location TEXT,
  duration_minutes INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  CONSTRAINT valid_interaction_type CHECK (interaction_type IN ('meeting', 'call', 'email', 'message', 'other')),
  CONSTRAINT positive_duration CHECK (duration_minutes IS NULL OR duration_minutes > 0)
);

COMMENT ON TABLE interactions IS 'Log of all interactions with contacts';

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Persons table indexes
CREATE INDEX idx_persons_user_id ON persons(user_id);
CREATE INDEX idx_persons_last_contact ON persons(last_contact DESC NULLS LAST);
CREATE INDEX idx_persons_follow_up_reminder ON persons(follow_up_reminder) WHERE follow_up_reminder IS NOT NULL;
CREATE INDEX idx_persons_name_trgm ON persons USING gin (name gin_trgm_ops); -- Fuzzy search
CREATE INDEX idx_persons_email ON persons(email) WHERE email IS NOT NULL;
CREATE INDEX idx_persons_interests ON persons USING gin(interests); -- Array search
CREATE INDEX idx_persons_first_name ON persons(first_name);
CREATE INDEX idx_persons_last_name ON persons(last_name);
CREATE INDEX idx_persons_family_members ON persons USING gin(family_members);

-- Full-text search index for persons
CREATE INDEX idx_persons_search ON persons USING gin(
  to_tsvector('english', 
    coalesce(name, '') || ' ' || 
    coalesce(first_name, '') || ' ' ||
    coalesce(last_name, '') || ' ' ||
    coalesce(email, '') || ' ' || 
    coalesce(notes, '') || ' ' || 
    coalesce(where_met, '') || ' ' ||
    coalesce(what_found_interesting, '')
  )
);

-- Tags table indexes
CREATE INDEX idx_tags_user_id ON tags(user_id);
CREATE INDEX idx_tags_name ON tags(name);

-- Person_tags indexes
CREATE INDEX idx_person_tags_person_id ON person_tags(person_id);
CREATE INDEX idx_person_tags_tag_id ON person_tags(tag_id);

-- Relationships indexes
CREATE INDEX idx_relationships_from_person ON relationships(from_person_id);
CREATE INDEX idx_relationships_to_person ON relationships(to_person_id);
CREATE INDEX idx_relationships_type ON relationships(relationship_type);

-- Attachments indexes
CREATE INDEX idx_attachments_person_id ON attachments(person_id);
CREATE INDEX idx_attachments_user_id ON attachments(user_id);
CREATE INDEX idx_attachments_type ON attachments(attachment_type);
CREATE INDEX idx_attachments_created_at ON attachments(created_at DESC);

-- Interactions indexes
CREATE INDEX idx_interactions_person_id ON interactions(person_id);
CREATE INDEX idx_interactions_user_id ON interactions(user_id);
CREATE INDEX idx_interactions_date ON interactions(interaction_date DESC);
CREATE INDEX idx_interactions_type ON interactions(interaction_type);

-- ============================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- ============================================

-- Create a generic function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

-- Apply trigger to persons table
CREATE TRIGGER update_persons_updated_at
  BEFORE UPDATE ON persons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to relationships table
CREATE TRIGGER update_relationships_updated_at
  BEFORE UPDATE ON relationships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to interactions table
CREATE TRIGGER update_interactions_updated_at
  BEFORE UPDATE ON interactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TRIGGER TO UPDATE LAST_CONTACT
-- ============================================
-- Automatically update persons.last_contact when an interaction is added

CREATE OR REPLACE FUNCTION update_person_last_contact()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE persons
  SET last_contact = NEW.date
  WHERE id = NEW.person_id
    AND (last_contact IS NULL OR last_contact < NEW.date);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

CREATE TRIGGER update_last_contact_on_interaction
  AFTER INSERT ON interactions
  FOR EACH ROW
  EXECUTE FUNCTION update_person_last_contact();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE person_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PERSONS POLICIES
-- ============================================

-- Users can view their own persons
CREATE POLICY "Users can view their own persons"
  ON persons FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own persons
CREATE POLICY "Users can insert their own persons"
  ON persons FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own persons
CREATE POLICY "Users can update their own persons"
  ON persons FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own persons
CREATE POLICY "Users can delete their own persons"
  ON persons FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- TAGS POLICIES
-- ============================================

CREATE POLICY "Users can view their own tags"
  ON tags FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tags"
  ON tags FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tags"
  ON tags FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tags"
  ON tags FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- PERSON_TAGS POLICIES
-- ============================================

-- Users can view person_tags for their own persons
CREATE POLICY "Users can view their own person_tags"
  ON person_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM persons
      WHERE persons.id = person_tags.person_id
      AND persons.user_id = auth.uid()
    )
  );

-- Users can insert person_tags for their own persons
CREATE POLICY "Users can insert their own person_tags"
  ON person_tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM persons
      WHERE persons.id = person_tags.person_id
      AND persons.user_id = auth.uid()
    )
  );

-- Users can delete person_tags for their own persons
CREATE POLICY "Users can delete their own person_tags"
  ON person_tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM persons
      WHERE persons.id = person_tags.person_id
      AND persons.user_id = auth.uid()
    )
  );

-- ============================================
-- RELATIONSHIPS POLICIES
-- ============================================

-- Users can view relationships involving their persons
CREATE POLICY "Users can view their own relationships"
  ON relationships FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM persons
      WHERE (persons.id = relationships.from_person_id
        OR persons.id = relationships.to_person_id)
      AND persons.user_id = auth.uid()
    )
  );

-- Users can insert relationships between their own persons
CREATE POLICY "Users can insert their own relationships"
  ON relationships FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM persons
      WHERE persons.id = relationships.from_person_id
      AND persons.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM persons
      WHERE persons.id = relationships.to_person_id
      AND persons.user_id = auth.uid()
    )
  );

-- Users can update their own relationships
CREATE POLICY "Users can update their own relationships"
  ON relationships FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM persons
      WHERE persons.id = relationships.from_person_id
      AND persons.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM persons
      WHERE persons.id = relationships.from_person_id
      AND persons.user_id = auth.uid()
    )
  );

-- Users can delete their own relationships
CREATE POLICY "Users can delete their own relationships"
  ON relationships FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM persons
      WHERE persons.id = relationships.from_person_id
      AND persons.user_id = auth.uid()
    )
  );

-- ============================================
-- ATTACHMENTS POLICIES
-- ============================================

CREATE POLICY "Users can view their own attachments"
  ON attachments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own attachments"
  ON attachments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own attachments"
  ON attachments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own attachments"
  ON attachments FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- INTERACTIONS POLICIES
-- ============================================

CREATE POLICY "Users can view their own interactions"
  ON interactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interactions"
  ON interactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interactions"
  ON interactions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interactions"
  ON interactions FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- HELPFUL VIEWS
-- ============================================

-- View to get persons with their tags
CREATE OR REPLACE VIEW persons_with_tags
WITH (security_invoker = true)
AS
SELECT 
  p.*,
  array_agg(t.name) FILTER (WHERE t.name IS NOT NULL) as tag_names,
  array_agg(t.color) FILTER (WHERE t.color IS NOT NULL) as tag_colors
FROM persons p
LEFT JOIN person_tags pt ON p.id = pt.person_id
LEFT JOIN tags t ON pt.tag_id = t.id
GROUP BY p.id;

-- View to get interaction count per person
CREATE OR REPLACE VIEW person_interaction_counts
WITH (security_invoker = true)
AS
SELECT 
  person_id,
  COUNT(*) as total_interactions,
  MAX(interaction_date) as last_interaction_date,
  COUNT(*) FILTER (WHERE interaction_type = 'meeting') as meeting_count,
  COUNT(*) FILTER (WHERE interaction_type = 'call') as call_count,
  COUNT(*) FILTER (WHERE interaction_type = 'email') as email_count
FROM interactions
GROUP BY person_id;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function for full-text search on persons
CREATE OR REPLACE FUNCTION search_persons(
  search_query TEXT,
  current_user_id UUID
)
RETURNS SETOF persons AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM persons
  WHERE user_id = current_user_id
    AND (
      to_tsvector('english', 
        coalesce(name, '') || ' ' || 
        coalesce(first_name, '') || ' ' ||
        coalesce(last_name, '') || ' ' ||
        coalesce(email, '') || ' ' || 
        coalesce(notes, '') || ' ' || 
        coalesce(where_met, '')
      ) @@ plainto_tsquery('english', search_query)
      OR name ILIKE '%' || search_query || '%'
      OR first_name ILIKE '%' || search_query || '%'
      OR last_name ILIKE '%' || search_query || '%'
      OR email ILIKE '%' || search_query || '%'
    )
  ORDER BY 
    CASE 
      WHEN name ILIKE search_query || '%' THEN 1
      WHEN first_name ILIKE search_query || '%' THEN 1
      WHEN name ILIKE '%' || search_query || '%' THEN 2
      WHEN first_name ILIKE '%' || search_query || '%' THEN 2
      ELSE 3
    END,
    name;
END;
$$ LANGUAGE plpgsql STABLE
SET search_path = '';

-- Function to get persons needing follow-up
CREATE OR REPLACE FUNCTION get_follow_up_reminders(
  current_user_id UUID
)
RETURNS SETOF persons AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM persons
  WHERE user_id = current_user_id
    AND follow_up_reminder IS NOT NULL
    AND follow_up_reminder <= timezone('utc'::text, now())
  ORDER BY follow_up_reminder ASC;
END;
$$ LANGUAGE plpgsql STABLE
SET search_path = '';

-- ============================================
-- SEED DATA (Optional - for testing)
-- ============================================

-- Insert some default tags for new users
-- You can uncomment this if you want default tags

/*
CREATE OR REPLACE FUNCTION create_default_tags_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO tags (user_id, name, color) VALUES
    (NEW.id, 'Friend', '#8b5cf6'),
    (NEW.id, 'Family', '#3b82f6'),
    (NEW.id, 'Work', '#10b981'),
    (NEW.id, 'Client', '#f59e0b'),
    (NEW.id, 'Mentor', '#ef4444'),
    (NEW.id, 'Neighbor', '#6366f1')
  ON CONFLICT (user_id, name) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

CREATE TRIGGER create_default_tags
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_tags_for_user();
*/

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant usage on schema to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant permissions on tables
GRANT ALL ON persons TO authenticated;
GRANT ALL ON tags TO authenticated;
GRANT ALL ON person_tags TO authenticated;
GRANT ALL ON relationships TO authenticated;
GRANT ALL ON attachments TO authenticated;
GRANT ALL ON interactions TO authenticated;

-- Grant permissions on views
GRANT SELECT ON persons_with_tags TO authenticated;
GRANT SELECT ON person_interaction_counts TO authenticated;

-- ============================================
-- COMPLETION MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'ReMember Me Schema Installation Complete!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Created tables:';
  RAISE NOTICE '  - persons (with full-text search)';
  RAISE NOTICE '  - tags';
  RAISE NOTICE '  - person_tags';
  RAISE NOTICE '  - relationships';
  RAISE NOTICE '  - attachments';
  RAISE NOTICE '  - interactions';
  RAISE NOTICE '';
  RAISE NOTICE 'Configured:';
  RAISE NOTICE '  - Row Level Security (RLS) on all tables';
  RAISE NOTICE '  - Performance indexes';
  RAISE NOTICE '  - Auto-updating timestamps';
  RAISE NOTICE '  - Full-text search capability';
  RAISE NOTICE '  - Helper views and functions';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Set up Supabase Storage bucket for attachments';
  RAISE NOTICE '  2. Configure authentication in Supabase Dashboard';
  RAISE NOTICE '  3. Update your .env.local with connection details';
  RAISE NOTICE '========================================';
END $$;

