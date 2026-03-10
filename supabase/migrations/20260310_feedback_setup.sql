-- Create feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('bug', 'idea', 'ui/ux', 'love')),
  description TEXT NOT NULL,
  screenshot_url TEXT,
  current_page TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Policies for feedback table
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'feedback' AND policyname = 'Users can insert their own feedback'
  ) THEN
    CREATE POLICY "Users can insert their own feedback" ON public.feedback
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'feedback' AND policyname = 'Users can view their own feedback'
  ) THEN
    CREATE POLICY "Users can view their own feedback" ON public.feedback
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create feedback_screenshots storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('feedback_screenshots', 'feedback_screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for feedback_screenshots
DO $$ BEGIN
  -- Policy for uploading
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Users can upload feedback screenshots'
  ) THEN
    CREATE POLICY "Users can upload feedback screenshots" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'feedback_screenshots' 
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;

  -- Policy for viewing
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Anyone can view feedback screenshots'
  ) THEN
    CREATE POLICY "Anyone can view feedback screenshots" ON storage.objects
      FOR SELECT USING (bucket_id = 'feedback_screenshots');
  END IF;
END $$;
