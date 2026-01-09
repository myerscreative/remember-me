-- Create a database function to insert interactions
-- This bypasses the schema path issue by using explicit schema references

CREATE OR REPLACE FUNCTION public.insert_interaction(
  p_person_id UUID,
  p_user_id UUID,
  p_interaction_type TEXT,
  p_interaction_date TIMESTAMPTZ,
  p_notes TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_interaction_id UUID;
BEGIN
  INSERT INTO public.interactions (
    person_id,
    user_id,
    interaction_type,
    interaction_date,
    notes
  ) VALUES (
    p_person_id,
    p_user_id,
    p_interaction_type,
    p_interaction_date,
    p_notes
  )
  RETURNING id INTO v_interaction_id;
  
  RETURN v_interaction_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.insert_interaction TO authenticated;
