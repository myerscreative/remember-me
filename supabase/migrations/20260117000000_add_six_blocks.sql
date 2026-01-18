-- Migration: Add 6 Core Information Blocks to persons table
-- This adds structured fields for the 6-block memory system

-- Add new columns for the 6 blocks
ALTER TABLE persons ADD COLUMN IF NOT EXISTS
  -- Block 1: Identity & Context (existing fields enhanced)
  relationship_type TEXT, -- 'friend', 'client', 'vendor', 'family', 'acquaintance'
  
  -- Block 2: Family & Personal Life (existing fields enhanced)
  life_stage TEXT, -- 'new_parent', 'empty_nester', 'caretaker', etc.
  family_dynamics TEXT, -- Additional family context
  
  -- Block 3: Career & Craft (existing fields enhanced)
  career_trajectory TEXT, -- Past → Present → Desired
  pain_points TEXT[], -- Work frustrations/challenges
  career_goals TEXT[], -- Professional aspirations
  
  -- Block 4: Interests & Hobbies (existing fields enhanced)
  side_projects JSONB DEFAULT '[]', -- [{name, description, status}]
  
  -- Block 5: Values & Motivations (NEW - completely missing)
  core_values TEXT[], -- ['security', 'freedom', 'recognition', 'contribution']
  motivators TEXT[], -- What drives them
  communication_style TEXT, -- 'direct', 'cautious', 'relational'
  personality_notes TEXT, -- Decision-making style, sensitivities
  
  -- Block 6: History & Touchpoints (existing shared_memories enhanced)
  promises JSONB DEFAULT '[]', -- [{promise, date, status}]
  wins_losses JSONB DEFAULT '[]', -- [{type, description, date}]
  open_loops JSONB DEFAULT '[]', -- [{item, date_created, priority}]
  
  -- 6-Block Structured Summaries (for AI extraction)
  identity_context TEXT,
  family_personal TEXT,
  career_craft TEXT,
  interests_hobbies TEXT,
  values_personality TEXT,
  history_touchpoints TEXT;

-- Add comments for documentation
COMMENT ON COLUMN persons.relationship_type IS 'Type of relationship: friend, client, vendor, family, acquaintance';
COMMENT ON COLUMN persons.life_stage IS 'Current life stage: new_parent, empty_nester, caretaker, career_builder, retired';
COMMENT ON COLUMN persons.career_trajectory IS 'Career path: past → present → desired future';
COMMENT ON COLUMN persons.pain_points IS 'Work-related frustrations and challenges';
COMMENT ON COLUMN persons.career_goals IS 'Professional goals and aspirations';
COMMENT ON COLUMN persons.core_values IS 'Core values: security, freedom, recognition, contribution, etc.';
COMMENT ON COLUMN persons.communication_style IS 'How they communicate: direct, cautious, relational';
COMMENT ON COLUMN persons.personality_notes IS 'Decision-making style, motivations, sensitivities';
COMMENT ON COLUMN persons.promises IS 'Promises made, commitments, follow-up items';
COMMENT ON COLUMN persons.wins_losses IS 'Significant wins and losses in the relationship';
COMMENT ON COLUMN persons.open_loops IS 'Open items, things to circle back on';

-- 6-Block structured summaries
COMMENT ON COLUMN persons.identity_context IS 'Block 1: Who they are, why they matter';
COMMENT ON COLUMN persons.family_personal IS 'Block 2: Family structure, life stage';
COMMENT ON COLUMN persons.career_craft IS 'Block 3: Career, pain points, goals';
COMMENT ON COLUMN persons.interests_hobbies IS 'Block 4: Hobbies, passions, interests';
COMMENT ON COLUMN persons.values_personality IS 'Block 5: Values, motivations, communication style';
COMMENT ON COLUMN persons.history_touchpoints IS 'Block 6: Past interactions, promises, shared experiences';
