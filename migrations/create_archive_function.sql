-- Database function to archive/unarchive contacts
-- This bypasses PostgREST schema cache issues by using raw SQL

CREATE OR REPLACE FUNCTION archive_contact(
  p_contact_id UUID,
  p_user_id UUID,
  p_archived BOOLEAN,
  p_reason TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION archive_contact(UUID, UUID, BOOLEAN, TEXT) TO authenticated;

COMMENT ON FUNCTION archive_contact IS 'Archives or unarchives a contact, bypassing PostgREST schema cache';

