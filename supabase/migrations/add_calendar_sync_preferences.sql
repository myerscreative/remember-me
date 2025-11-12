-- Add Calendar Sync Preferences to ReMember Me
-- Enables meeting prep feature with calendar integration

-- Create calendar_preferences table
CREATE TABLE IF NOT EXISTS calendar_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Sync settings
  calendar_enabled BOOLEAN DEFAULT FALSE,
  notification_time INTEGER DEFAULT 30 CHECK (notification_time >= 5 AND notification_time <= 120),
  only_known_contacts BOOLEAN DEFAULT FALSE,

  -- Provider information
  provider TEXT CHECK (provider IN ('google', 'microsoft', 'apple')),

  -- OAuth tokens (encrypted at application level before storage)
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expiry TIMESTAMPTZ,

  -- Sync status
  last_sync_at TIMESTAMPTZ,
  last_sync_error TEXT,
  sync_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(user_id),
  CHECK (calendar_enabled = FALSE OR provider IS NOT NULL)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_calendar_preferences_user_id
ON calendar_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_calendar_preferences_enabled
ON calendar_preferences(calendar_enabled)
WHERE calendar_enabled = TRUE;

-- Enable Row Level Security
ALTER TABLE calendar_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own calendar preferences"
ON calendar_preferences
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own calendar preferences"
ON calendar_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar preferences"
ON calendar_preferences
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar preferences"
ON calendar_preferences
FOR DELETE
USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_calendar_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function
CREATE TRIGGER trigger_update_calendar_preferences_updated_at
BEFORE UPDATE ON calendar_preferences
FOR EACH ROW
EXECUTE FUNCTION update_calendar_preferences_updated_at();

-- Create meeting_notifications table (for tracking which notifications have been shown)
CREATE TABLE IF NOT EXISTS meeting_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Event details
  event_id TEXT NOT NULL,
  event_title TEXT NOT NULL,
  event_start TIMESTAMPTZ NOT NULL,
  event_provider TEXT NOT NULL,

  -- Notification status
  notification_shown BOOLEAN DEFAULT FALSE,
  notification_shown_at TIMESTAMPTZ,
  notification_dismissed BOOLEAN DEFAULT FALSE,
  notification_dismissed_at TIMESTAMPTZ,

  -- Matched contacts count
  matched_contacts_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(user_id, event_id),
  CHECK (event_start > created_at - INTERVAL '7 days')
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_meeting_notifications_user_id
ON meeting_notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_meeting_notifications_event_start
ON meeting_notifications(event_start);

CREATE INDEX IF NOT EXISTS idx_meeting_notifications_shown
ON meeting_notifications(notification_shown, event_start)
WHERE notification_shown = FALSE;

-- Enable Row Level Security
ALTER TABLE meeting_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own meeting notifications"
ON meeting_notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meeting notifications"
ON meeting_notifications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meeting notifications"
ON meeting_notifications
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meeting notifications"
ON meeting_notifications
FOR DELETE
USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_meeting_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function
CREATE TRIGGER trigger_update_meeting_notifications_updated_at
BEFORE UPDATE ON meeting_notifications
FOR EACH ROW
EXECUTE FUNCTION update_meeting_notifications_updated_at();

-- Function to clean up old meeting notifications (older than 7 days)
CREATE OR REPLACE FUNCTION cleanup_old_meeting_notifications()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM meeting_notifications
  WHERE event_start < NOW() - INTERVAL '7 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Comment on tables and columns
COMMENT ON TABLE calendar_preferences IS 'Stores user calendar sync preferences for meeting prep feature';
COMMENT ON COLUMN calendar_preferences.calendar_enabled IS 'Whether calendar sync is enabled for this user';
COMMENT ON COLUMN calendar_preferences.notification_time IS 'Minutes before meeting to show prep notification (5-120)';
COMMENT ON COLUMN calendar_preferences.only_known_contacts IS 'If true, only show prep for meetings with known contacts';
COMMENT ON COLUMN calendar_preferences.provider IS 'Calendar provider: google, microsoft, or apple';
COMMENT ON COLUMN calendar_preferences.access_token_encrypted IS 'Encrypted OAuth access token';
COMMENT ON COLUMN calendar_preferences.refresh_token_encrypted IS 'Encrypted OAuth refresh token';

COMMENT ON TABLE meeting_notifications IS 'Tracks which meeting prep notifications have been shown to avoid duplicates';
COMMENT ON COLUMN meeting_notifications.event_id IS 'Unique event ID from calendar provider';
COMMENT ON COLUMN meeting_notifications.notification_shown IS 'Whether notification has been displayed';
COMMENT ON COLUMN meeting_notifications.matched_contacts_count IS 'Number of contacts matched for this meeting';

-- Grant permissions (if needed for service role)
-- GRANT ALL ON calendar_preferences TO service_role;
-- GRANT ALL ON meeting_notifications TO service_role;
