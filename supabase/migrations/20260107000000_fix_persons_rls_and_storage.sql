-- Fix RLS policy for persons table to include explicit WITH CHECK clause
-- This migration adds the WITH CHECK clause to the UPDATE policy to ensure
-- proper row-level security for photo updates and other UPDATE operations

-- Drop the existing UPDATE policy
DROP POLICY IF EXISTS "Users can update their own persons" ON public.persons;

-- Recreate the UPDATE policy with both USING and WITH CHECK clauses
CREATE POLICY "Users can update their own persons"
  ON public.persons
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- STORAGE BUCKET SETUP FOR AVATARS
-- ============================================

-- Create the avatars bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;

-- Allow authenticated users to upload avatars to their own folder
CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow public read access to all avatars
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

-- Allow users to update their own avatars
CREATE POLICY "Users can update their own avatars"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to delete their own avatars
CREATE POLICY "Users can delete their own avatars"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================
-- VERIFICATION
-- ============================================

-- Add a comment for documentation
COMMENT ON POLICY "Users can update their own persons" ON public.persons IS
  'Ensures users can only update persons they own, both for existing rows (USING) and modified rows (WITH CHECK)';

COMMENT ON POLICY "Authenticated users can upload avatars" ON storage.objects IS
  'Allows authenticated users to upload avatar images to their own user folder';

COMMENT ON POLICY "Avatar images are publicly accessible" ON storage.objects IS
  'Makes avatar images readable by anyone for display purposes';
