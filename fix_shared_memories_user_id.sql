-- Add user_id column to existing shared_memories table
ALTER TABLE public.shared_memories 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update existing rows to set user_id from the person's user_id
UPDATE public.shared_memories sm
SET user_id = p.user_id
FROM public.persons p
WHERE sm.person_id = p.id
AND sm.user_id IS NULL;

-- Make user_id NOT NULL after populating it
ALTER TABLE public.shared_memories 
ALTER COLUMN user_id SET NOT NULL;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Users can view their own shared memories" ON public.shared_memories;
DROP POLICY IF EXISTS "Users can insert their own shared memories" ON public.shared_memories;
DROP POLICY IF EXISTS "Users can update their own shared memories" ON public.shared_memories;
DROP POLICY IF EXISTS "Users can delete their own shared memories" ON public.shared_memories;

-- Recreate policies with user_id
CREATE POLICY "Users can view their own shared memories" ON public.shared_memories
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own shared memories" ON public.shared_memories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shared memories" ON public.shared_memories
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shared memories" ON public.shared_memories
    FOR DELETE USING (auth.uid() = user_id);
