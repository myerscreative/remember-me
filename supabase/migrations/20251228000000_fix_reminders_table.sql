-- Migration to fix the reminders table (ensuring it exists and has correct references)
-- This migration is intended to run after the persons table is created.

CREATE TABLE IF NOT EXISTS public.reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    person_id UUID REFERENCES public.persons(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    due_date DATE NOT NULL,
    due_time TIME,
    completed BOOLEAN DEFAULT false,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON public.reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_person_id ON public.reminders(person_id);
CREATE INDEX IF NOT EXISTS idx_reminders_due_date ON public.reminders(due_date);

-- Enable RLS
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reminders' AND policyname = 'Users can view their own reminders') THEN
        CREATE POLICY "Users can view their own reminders" ON public.reminders FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reminders' AND policyname = 'Users can insert their own reminders') THEN
        CREATE POLICY "Users can insert their own reminders" ON public.reminders FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reminders' AND policyname = 'Users can update their own reminders') THEN
        CREATE POLICY "Users can update their own reminders" ON public.reminders FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reminders' AND policyname = 'Users can delete their own reminders') THEN
        CREATE POLICY "Users can delete their own reminders" ON public.reminders FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;
