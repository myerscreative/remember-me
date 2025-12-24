-- Create persons table (missing from history)
CREATE TABLE IF NOT EXISTS public.persons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT,
  photo_url TEXT,
  phone TEXT,
  email TEXT,
  linkedin TEXT,
  birthday DATE,
  family_members JSONB,
  where_met TEXT,
  who_introduced TEXT,
  when_met TEXT,
  why_stay_in_contact TEXT,
  what_found_interesting TEXT,
  most_important_to_them TEXT,
  interests TEXT[],
  family_notes TEXT,
  notes TEXT,
  last_contact TIMESTAMPTZ,
  follow_up_reminder TIMESTAMPTZ,
  archived BOOLEAN DEFAULT false,
  archived_at TIMESTAMPTZ,
  archived_reason TEXT,
  first_impression TEXT,
  memorable_moment TEXT,
  relationship_value TEXT,
  what_i_offered TEXT,
  what_they_offered TEXT,
  story_completeness INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.persons ENABLE ROW LEVEL SECURITY;

-- Basic Policies
CREATE POLICY "Users can view their own persons" ON public.persons
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own persons" ON public.persons
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own persons" ON public.persons
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own persons" ON public.persons
  FOR DELETE USING (auth.uid() = user_id);
