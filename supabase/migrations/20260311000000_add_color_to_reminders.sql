-- Add color column to reminders for visual distinction (e.g. left border accent)
ALTER TABLE public.reminders
ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#8b5cf6';
