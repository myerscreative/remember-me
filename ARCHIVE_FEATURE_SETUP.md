# Archive Feature Setup

The Archive feature has been added to allow you to "soft delete" contacts without permanently removing them from your database.

## What Changed

1. **Database Migration**: Added three new columns to the `persons` table:
   - `archived` (boolean) - Marks if a contact is archived
   - `archived_at` (timestamp) - When the contact was archived
   - `archived_reason` (text) - Why the contact was archived

2. **UI Updates**: The Archive button is now more prominent with a red border and appears below the contact action buttons (Call, Email, Text)

## How to Apply the Migration

### Option 1: Supabase Dashboard (Recommended)

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click on **SQL Editor** in the left sidebar
4. Click **New query**
5. Copy and paste the contents of `migrations/add_archive_fields.sql`
6. Click **Run** or press `Cmd/Ctrl + Enter`
7. You should see "Success. No rows returned"

### Option 2: Supabase CLI

If you have the Supabase CLI installed:

```bash
cd remember-me
supabase db push migrations/add_archive_fields.sql
```

## Verifying the Migration

After running the migration, you can verify it worked:

1. Go to **Table Editor** in Supabase Dashboard
2. Select the `persons` table
3. You should see three new columns at the end: `archived`, `archived_at`, `archived_reason`

## Using the Archive Feature

Once the migration is applied:

1. Open any contact detail page
2. Scroll down below the Call/Email/Text buttons
3. You'll see a red **"Archive Contact"** button
4. Click it, enter a reason, and confirm
5. The contact will be archived and you'll be redirected to the home page

## Future Enhancement

Currently, archived contacts are hidden from the main list. A future update could add:
- A filter toggle to show/hide archived contacts
- An "Archived Contacts" page
- Bulk archive/unarchive operations

## Rollback (if needed)

If you need to remove these fields:

```sql
ALTER TABLE persons 
DROP COLUMN IF EXISTS archived,
DROP COLUMN IF EXISTS archived_at,
DROP COLUMN IF EXISTS archived_reason;

DROP INDEX IF EXISTS idx_persons_archived;
```

