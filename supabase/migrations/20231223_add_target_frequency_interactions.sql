-- Migration: Add target_frequency_days and interactions table
-- Run this in Supabase SQL Editor

-- Add target_frequency_days to persons (default 30 days = monthly)
ALTER TABLE public.persons 
ADD COLUMN IF NOT EXISTS target_frequency_days INTEGER DEFAULT 30;

-- Create interactions table for logging contact history
CREATE TABLE IF NOT EXISTS public.interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID REFERENCES public.persons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  type TEXT CHECK (type IN ('call', 'text', 'email', 'in-person', 'social', 'other')) NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_interactions_person_id ON public.interactions(person_id);
CREATE INDEX IF NOT EXISTS idx_interactions_user_id ON public.interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_created_at ON public.interactions(created_at DESC);

-- Enable RLS on interactions
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;

-- RLS policy: Users can only see their own interactions
CREATE POLICY "Users can view own interactions" ON public.interactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own interactions" ON public.interactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own interactions" ON public.interactions
  FOR DELETE USING (auth.uid() = user_id);
