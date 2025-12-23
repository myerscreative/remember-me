-- Create interactions table
CREATE TABLE IF NOT EXISTS interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    person_id UUID REFERENCES persons(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('call', 'email', 'text', 'meeting', 'other')),
    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own interactions" ON interactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own interactions" ON interactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own interactions" ON interactions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own interactions" ON interactions
    FOR DELETE USING (auth.uid() = user_id);

-- Create index
CREATE INDEX IF NOT EXISTS idx_interactions_person_id ON interactions(person_id);
CREATE INDEX IF NOT EXISTS idx_interactions_user_id ON interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_date ON interactions(date DESC);
