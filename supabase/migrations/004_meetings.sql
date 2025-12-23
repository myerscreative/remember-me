-- Meetings table
CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Calendar data
  calendar_event_id TEXT NOT NULL,
  calendar_provider TEXT DEFAULT 'google',
  
  -- Meeting details
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  location TEXT,
  meeting_url TEXT,
  
  -- Attendees
  attendees JSONB DEFAULT '[]'::jsonb,
  
  -- Matched contact
  contact_id UUID REFERENCES persons(id) ON DELETE SET NULL,
  match_confidence TEXT, -- high, medium, low
  
  -- Meeting metadata
  is_first_meeting BOOLEAN DEFAULT false,
  importance TEXT DEFAULT 'normal', -- normal, important, critical
  meeting_type TEXT, -- follow-up, first-meeting, catch-up, etc.
  
  -- Prep data
  conversation_starters JSONB DEFAULT '[]'::jsonb,
  mutual_connections JSONB DEFAULT '[]'::jsonb,
  prep_notes TEXT,
  prep_status TEXT DEFAULT 'not_started', -- not_started, in_progress, ready
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, calendar_event_id)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_meetings_user_id ON meetings(user_id);
CREATE INDEX IF NOT EXISTS idx_meetings_start_time ON meetings(start_time);
CREATE INDEX IF NOT EXISTS idx_meetings_contact_id ON meetings(contact_id);

-- RLS policies
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own meetings"
  ON meetings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meetings"
  ON meetings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meetings"
  ON meetings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meetings"
  ON meetings FOR DELETE
  USING (auth.uid() = user_id);

-- Update timestamp trigger (if function exists, otherwise create it or use simpler trigger)
-- Assuming update_updated_at_column exists from previous migrations.
-- If not, we might need to create it. I'll add a check or create it safely if specific for this table?
-- Standard is usually `extensions.moddatetime`.
-- I'll stick to the user's requested trigger assuming the fuction exists. 
-- The user provided: EXECUTE FUNCTION update_updated_at_column();
-- I will blindly trust this or wrap in a DO block if I could, but SQL file is static.
-- I'll add the content as is.

CREATE TRIGGER update_meetings_updated_at
  BEFORE UPDATE ON meetings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
