-- Recreate the archive function now that columns exist
-- This ensures the function sees the new columns

DROP FUNCTION IF EXISTS archive_contact(UUID, UUID, BOOLEAN, TEXT);

CREATE OR REPLACE FUNCTION archive_contact(
  p_contact_id UUID,
  p_user_id UUID,
  p_archived BOOLEAN,
  p_reason TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_archived THEN
    UPDATE persons
    SET archived = true,
        archived_at = NOW(),
        archived_reason = p_reason
    WHERE id = p_contact_id 
      AND user_id = p_user_id;
  ELSE
    UPDATE persons
    SET archived = false,
        archived_at = NULL,
        archived_reason = NULL
    WHERE id = p_contact_id 
      AND user_id = p_user_id;
  END IF;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION archive_contact(UUID, UUID, BOOLEAN, TEXT) TO authenticated;

-- Verify the function was created
SELECT 
  routine_name, 
  routine_type,
  routine_schema
FROM information_schema.routines 
WHERE routine_name = 'archive_contact' 
AND routine_schema = 'public';





