-- Add importance column to persons table
ALTER TABLE public.persons 
ADD COLUMN IF NOT EXISTS importance TEXT DEFAULT 'medium' CHECK (importance IN ('high', 'medium', 'low'));

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_persons_importance ON public.persons(importance);
