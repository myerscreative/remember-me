-- Create loop_groups table
CREATE TABLE IF NOT EXISTS loop_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  icon_name TEXT NOT NULL DEFAULT 'Folder',
  color TEXT DEFAULT '#8B5CF6',
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create junction table for persons and loop_groups
CREATE TABLE IF NOT EXISTS person_loop_groups (
  person_id UUID REFERENCES persons(id) ON DELETE CASCADE NOT NULL,
  loop_group_id UUID REFERENCES loop_groups(id) ON DELETE CASCADE NOT NULL,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (person_id, loop_group_id)
);

-- Enable RLS on loop_groups
ALTER TABLE loop_groups ENABLE ROW LEVEL SECURITY;

-- Policies for loop_groups
CREATE POLICY "Users can read own loop groups"
ON loop_groups FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own loop groups"
ON loop_groups FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own loop groups"
ON loop_groups FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own loop groups"
ON loop_groups FOR DELETE
USING (auth.uid() = user_id);

-- Enable RLS on person_loop_groups
ALTER TABLE person_loop_groups ENABLE ROW LEVEL SECURITY;

-- Policies for person_loop_groups
CREATE POLICY "Users can read own person loop groups"
ON person_loop_groups FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM persons p
    WHERE p.id = person_loop_groups.person_id
    AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert own person loop groups"
ON person_loop_groups FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM persons p
    WHERE p.id = person_loop_groups.person_id
    AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own person loop groups"
ON person_loop_groups FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM persons p
    WHERE p.id = person_loop_groups.person_id
    AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own person loop groups"
ON person_loop_groups FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM persons p
    WHERE p.id = person_loop_groups.person_id
    AND p.user_id = auth.uid()
  )
);

-- Indexes for loop_groups
CREATE INDEX idx_loop_groups_user_id ON loop_groups(user_id);
CREATE INDEX idx_loop_groups_position ON loop_groups(position);

-- Indexes for person_loop_groups
CREATE INDEX idx_person_loop_groups_person_id ON person_loop_groups(person_id);
CREATE INDEX idx_person_loop_groups_loop_group_id ON person_loop_groups(loop_group_id);
CREATE INDEX idx_person_loop_groups_position ON person_loop_groups(position);

-- Create a view to get loop groups with person count
CREATE OR REPLACE VIEW loop_groups_with_counts AS
SELECT
  lg.*,
  COUNT(plg.person_id) as person_count
FROM loop_groups lg
LEFT JOIN person_loop_groups plg ON lg.id = plg.loop_group_id
GROUP BY lg.id;
