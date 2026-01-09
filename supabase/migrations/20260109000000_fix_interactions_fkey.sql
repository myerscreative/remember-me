-- Fix foreign key constraint to explicitly reference public.persons
-- This fixes the "relation 'persons' does not exist" error

-- Drop the existing foreign key constraint
ALTER TABLE public.interactions 
DROP CONSTRAINT IF EXISTS interactions_person_id_fkey;

-- Re-add the constraint with explicit schema reference
ALTER TABLE public.interactions
ADD CONSTRAINT interactions_person_id_fkey 
FOREIGN KEY (person_id) 
REFERENCES public.persons(id) 
ON DELETE CASCADE;
