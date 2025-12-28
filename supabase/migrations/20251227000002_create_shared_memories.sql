-- Migration to create shared_memories table
CREATE TABLE IF NOT EXISTS public.shared_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    person_id UUID REFERENCES public.persons(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.shared_memories ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own shared memories" ON public.shared_memories
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own shared memories" ON public.shared_memories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shared memories" ON public.shared_memories
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shared memories" ON public.shared_memories
    FOR DELETE USING (auth.uid() = user_id);

-- Updated At Trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_shared_memories_updated_at') THEN
        CREATE TRIGGER set_shared_memories_updated_at
        BEFORE UPDATE ON public.shared_memories
        FOR EACH ROW
        EXECUTE PROCEDURE public.handle_updated_at();
    END IF;
END $$;
