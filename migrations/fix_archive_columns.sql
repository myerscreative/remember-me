-- Step 1: Verify columns exist (run this first)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'persons' 
AND column_name IN ('archived', 'archived_at', 'archived_reason')
ORDER BY column_name;

-- Step 2: If the above returns 0 rows, run this to add the columns:
-- (Only run if Step 1 shows no results)

DO $$
BEGIN
  -- Add archived column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'persons' 
    AND column_name = 'archived'
  ) THEN
    ALTER TABLE public.persons ADD COLUMN archived BOOLEAN DEFAULT FALSE;
  END IF;

  -- Add archived_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'persons' 
    AND column_name = 'archived_at'
  ) THEN
    ALTER TABLE public.persons ADD COLUMN archived_at TIMESTAMP WITH TIME ZONE;
  END IF;

  -- Add archived_reason column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'persons' 
    AND column_name = 'archived_reason'
  ) THEN
    ALTER TABLE public.persons ADD COLUMN archived_reason TEXT;
  END IF;
END $$;

-- Step 3: Verify again (should show 3 rows now)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'persons' 
AND column_name IN ('archived', 'archived_at', 'archived_reason')
ORDER BY column_name;

-- Step 4: Create the archive function (run this after columns are confirmed)
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
    UPDATE public.persons
    SET archived = true,
        archived_at = NOW(),
        archived_reason = p_reason
    WHERE id = p_contact_id 
      AND user_id = p_user_id;
  ELSE
    UPDATE public.persons
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

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_persons_archived 
ON public.persons(user_id, archived) 
WHERE archived = false;

