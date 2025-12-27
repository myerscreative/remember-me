-- Create user_settings table
CREATE TABLE user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Profile
  display_name TEXT,
  
  -- Network preferences
  default_network_view TEXT DEFAULT 'circular',
  show_birthdays_on_network BOOLEAN DEFAULT true,
  auto_favorite_new_contacts BOOLEAN DEFAULT false,
  network_zoom_level INTEGER DEFAULT 100,
  
  -- Notifications
  email_notifications BOOLEAN DEFAULT true,
  birthday_reminders BOOLEAN DEFAULT true,
  birthday_reminder_days INTEGER DEFAULT 7,
  contact_reminders BOOLEAN DEFAULT true,
  
  -- Reminders
  default_reminder_time TIME DEFAULT '09:00',
  reminder_frequency TEXT DEFAULT 'weekly',
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '08:00',
  
  -- Display
  theme TEXT DEFAULT 'light',
  compact_mode BOOLEAN DEFAULT false,
  show_last_contact BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own settings
CREATE POLICY "Users can read own settings"
ON user_settings FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own settings
CREATE POLICY "Users can insert own settings"
ON user_settings FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own settings
CREATE POLICY "Users can update own settings"
ON user_settings FOR UPDATE
USING (auth.uid() = user_id);

-- Create index
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);


