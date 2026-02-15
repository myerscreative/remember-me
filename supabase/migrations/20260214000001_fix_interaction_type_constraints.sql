-- Drop the old, overly restrictive constraint that blocks 'text', 'in-person', 'social'
ALTER TABLE public.interactions DROP CONSTRAINT IF EXISTS valid_interaction_type;

-- Ensure the correct, broader constraint exists
ALTER TABLE public.interactions DROP CONSTRAINT IF EXISTS interactions_type_check;
ALTER TABLE public.interactions ADD CONSTRAINT interactions_type_check 
  CHECK (type IN ('call', 'email', 'text', 'meeting', 'other', 'in-person', 'social'));
