# Storage Bucket Setup for Avatars

## Overview
This document explains the storage bucket configuration for contact avatar images and the RLS policy fix for photo updates.

## Problem
Users were encountering "new row violates row-level security policy" errors when trying to update contact avatars. This was caused by two issues:

1. **Missing WITH CHECK clause in RLS policy**: The UPDATE policy on the `persons` table didn't have an explicit `WITH CHECK` clause to validate the modified row.
2. **No user_id verification in update query**: The avatar sync code wasn't explicitly checking that the contact belongs to the authenticated user.
3. **Missing storage bucket policies**: The `avatars` storage bucket didn't have proper RLS policies configured.

## Solution

### 1. Code Fix
Updated `/lib/contacts/avatarSyncUtils.ts` to add explicit user_id verification:

```typescript
// Before
.update({ photo_url: photoUrl })
.eq('id', matchedContact.id);

// After
.update({ photo_url: photoUrl })
.eq('id', matchedContact.id)
.eq('user_id', userId);
```

### 2. Database Migration
Run the migration file `20260107000000_fix_persons_rls_and_storage.sql` which:

- Adds explicit `WITH CHECK` clause to the persons UPDATE policy
- Creates the `avatars` storage bucket (if it doesn't exist)
- Sets up RLS policies for avatar uploads

### 3. Storage Bucket Policies
The migration creates the following policies:

1. **Upload Policy**: Authenticated users can upload avatars to their own folder (`{user_id}/`)
2. **Read Policy**: Anyone can read avatar images (public access for display)
3. **Update Policy**: Users can only update avatars in their own folder
4. **Delete Policy**: Users can only delete avatars in their own folder

## Applying the Migration

### Option 1: Using Supabase CLI (Recommended)
```bash
supabase db push
```

### Option 2: Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase/migrations/20260107000000_fix_persons_rls_and_storage.sql`
4. Click **Run**

### Option 3: Manual Dashboard Setup
If you prefer to set up the storage bucket manually:

#### Create the Bucket:
1. Go to **Storage** in your Supabase dashboard
2. Click **New bucket**
3. Name it `avatars`
4. Enable **Public bucket**
5. Click **Create bucket**

#### Configure Policies:
1. Click on the `avatars` bucket
2. Go to **Policies** tab
3. Add the policies from the migration file

## Folder Structure
Avatar images are organized by user ID:
```
avatars/
├── {user-id-1}/
│   ├── {contact-id}-{timestamp}.jpg
│   └── {contact-id}-{timestamp}.png
└── {user-id-2}/
    └── {contact-id}-{timestamp}.jpg
```

## Verification
After applying the migration, verify the setup:

1. **Check RLS Policy**:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'persons' AND policyname LIKE '%update%';
   ```

   Should show both `USING` and `WITH CHECK` clauses.

2. **Check Storage Bucket**:
   - Go to **Storage** in Supabase dashboard
   - Verify `avatars` bucket exists and is public

3. **Test Avatar Upload**:
   - Try uploading a contact avatar
   - Should succeed without RLS errors

## Troubleshooting

### Still getting RLS errors?
1. Make sure you're authenticated (check `auth.uid()` is not null)
2. Verify the contact belongs to your user (`user_id` matches your auth UID)
3. Check browser console for specific error messages

### Storage upload fails?
1. Verify the `avatars` bucket exists
2. Check bucket is set to public
3. Ensure storage policies are applied correctly
4. Verify file size doesn't exceed limits (default: 50MB)

### Permission denied errors?
1. Check you're logged in
2. Verify your Supabase client is properly initialized
3. Check the file path follows the pattern: `{user_id}/{contact_id}-{timestamp}.{ext}`

## Security Notes
- ✅ Users can only update contacts they own
- ✅ Users can only upload to their own folder
- ✅ Avatar images are publicly readable (for display)
- ✅ Users cannot access/modify other users' avatars
- ✅ Folder structure enforces user isolation

## Related Files
- `/lib/contacts/avatarSyncUtils.ts` - Avatar sync utility functions
- `/supabase/migrations/20260107000000_fix_persons_rls_and_storage.sql` - Migration file
- `/supabase-schema.sql` - Main database schema
