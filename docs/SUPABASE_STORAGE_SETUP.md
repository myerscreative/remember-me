# Supabase Storage Configuration for Loop Group Icons

## Storage Bucket Setup

To enable custom icon uploads for Loop Groups, you need to create a storage bucket in your Supabase project.

### 1. Create the Storage Bucket

In your Supabase Dashboard:

1. Go to **Storage** section
2. Click "**New bucket**"
3. Configure the bucket:
   - **Name**: `loop-group-icons`
   - **Public bucket**: ✅ Enabled (icons need to be publicly accessible)
   - **File size limit**: 5 MB (recommended)
   - **Allowed MIME types**: `image/png, image/jpeg, image/jpg, image/gif, image/webp`

### 2. Set Up Storage Policies

After creating the bucket, add these Row Level Security (RLS) policies:

```sql
-- Policy: Users can upload icons to their own folder
CREATE POLICY "Users can upload their own icons"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'loop-group-icons' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update their own icons
CREATE POLICY "Users can update their own icons"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'loop-group-icons' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own icons
CREATE POLICY "Users can delete their own icons"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'loop-group-icons' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Anyone can view icons (public read)
CREATE POLICY "Public icons are viewable by anyone"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'loop-group-icons');
```

### 3. Folder Structure

Icons will be organized by user ID:

```
loop-group-icons/
├── {user-id-1}/
│   ├── 1234567890_abc123.png
│   ├── 1234567891_def456.png
│   └── ...
├── {user-id-2}/
│   ├── 1234567892_ghi789.png
│   └── ...
└── ...
```

### 4. Image Processing

The app automatically:
- Accepts PNG, JPG, JPEG, GIF, and WEBP formats
- Crops images to square aspect ratio
- Limits file size to 5MB
- Converts to PNG for storage
- Generates unique filenames with timestamps

### 5. Testing the Setup

After configuration:

1. Run the database migrations:
   ```bash
   # Execute in Supabase SQL Editor:
   # migrations/create_loop_groups.sql
   # migrations/add_custom_icon_url.sql
   ```

2. Test the upload feature:
   - Navigate to `/loops`
   - Create or edit a loop group
   - Click "Upload Image" in the icon selector
   - Select an image and crop it
   - Save the loop group

3. Verify the storage:
   - Check Storage > loop-group-icons in Supabase Dashboard
   - Confirm your user folder exists
   - Verify the icon file was uploaded

### 6. Troubleshooting

**Upload fails with "Failed to upload custom icon"**
- Verify the bucket exists and is named exactly `loop-group-icons`
- Check that RLS policies are correctly configured
- Ensure the bucket is set to public

**Icons don't display**
- Verify the bucket is set to **Public**
- Check the `custom_icon_url` field in the database contains the full public URL
- Verify RLS policies allow public SELECT

**Permission denied errors**
- Ensure user is authenticated
- Check RLS policies match the user's ID
- Verify folder structure uses auth.uid()

### 7. Optional: Advanced Configuration

**Enable image optimization (recommended):**

Add transformation options in Supabase Dashboard under Storage settings:
- Enable image transformations
- Set max dimensions (e.g., 512x512)
- Enable WebP conversion for smaller file sizes

**Add webhook for cleanup:**

Create a webhook to delete orphaned icons when loop groups are deleted:

```sql
-- Function to delete icon on loop group deletion
CREATE OR REPLACE FUNCTION delete_loop_group_icon()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.custom_icon_url IS NOT NULL THEN
    -- Extract file path from URL
    -- Delete from storage
    -- This is handled in the application layer currently
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger (optional, currently handled in app)
-- CREATE TRIGGER on_loop_group_delete
-- BEFORE DELETE ON loop_groups
-- FOR EACH ROW EXECUTE FUNCTION delete_loop_group_icon();
```

## Summary

Once configured, users can:
- ✅ Upload custom PNG/JPG images as loop group icons
- ✅ Crop images to square format
- ✅ See custom icons in the loop grid and detail pages
- ✅ Remove custom icons and revert to preset Lucide icons
- ✅ Have their icons automatically cleaned up on deletion

For more information, see: https://supabase.com/docs/guides/storage
