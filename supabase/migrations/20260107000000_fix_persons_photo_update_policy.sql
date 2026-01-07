-- Fix RLS policy for persons table to allow photo_url updates
-- This migration ensures users can update the photo_url field for their own contacts

-- Drop existing update policy if it exists
DROP POLICY IF EXISTS "Users can update own persons" ON persons;
DROP POLICY IF EXISTS "Users can update their own persons" ON persons;

-- Create a comprehensive update policy that allows all fields including photo_url
CREATE POLICY "Users can update their own persons"
ON persons
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Ensure the policy is enabled
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;
