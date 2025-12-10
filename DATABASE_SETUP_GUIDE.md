# Database Setup Guide - ReMember Me

## Problem Summary

The application was trying to save contact data with fields that don't exist in your Supabase database yet, causing the error:
```
"Could not find the 'first_impression' column of 'persons' in the schema cache"
```

## What Was Fixed (Code Changes)

✅ **Fixed `ParsedContactData` interfaces** in:
- `/app/contacts/new/page.tsx` - Added missing fields: `firstImpression`, `memorableMoment`, `familyMembers`, `misc`
- `/components/voice-entry-modal.tsx` - Added missing fields: `firstImpression`, `memorableMoment`

✅ **Updated voice entry handler** in `/app/contacts/new/page.tsx`:
- Added `firstImpression` and `memorableMoment` to the form data merge logic

✅ **Updated parse-contact API** in `/app/api/parse-contact/route.ts`:
- Added `firstImpression` and `memorableMoment` to the AI extraction prompt
- Added these fields to the cleaned data response

## What You Need to Do (Database Setup)

### Step 1: Run the Base Schema

Your database needs the base tables created first.

1. **Open your Supabase Dashboard** at https://supabase.com
2. **Go to SQL Editor** (left sidebar)
3. **Click "New Query"**
4. **Copy the ENTIRE contents** of the file: `supabase-schema.sql`
5. **Paste it into the SQL Editor**
6. **Click "Run"** (or press Cmd/Ctrl + Enter)

This creates:
- `persons` table (base structure)
- `tags` table
- `person_tags` junction table
- `relationships` table
- `attachments` table
- `interactions` table
- All indexes, triggers, RLS policies, and helper functions

### Step 2: Run the Migration to Add Missing Columns

After Step 1 completes successfully, you need to add the additional columns.

1. **Create another new query** in Supabase SQL Editor
2. **Copy the ENTIRE contents** of the file: `migrations/add_relationship_memory_features.sql`
3. **Paste it and Run**

This adds these columns to the `persons` table:
- ✅ `first_impression` (TEXT) - **This fixes your error!**
- ✅ `memorable_moment` (TEXT)
- ✅ `archived` (BOOLEAN)
- ✅ `archived_at` (TIMESTAMP)
- ✅ `archived_reason` (TEXT)
- ✅ `relationship_value` (TEXT)
- ✅ `what_i_offered` (TEXT)
- ✅ `what_they_offered` (TEXT)
- ✅ `story_completeness` (INTEGER)

Plus helpful database functions for:
- Calculating story completeness
- Detecting relationship decay
- Context-based search
- Viewing incomplete stories

## After Running the Migrations

1. **Refresh your app** in the browser
2. **Try creating a contact again** - the error should be gone!
3. **Test the voice entry feature** - it will now capture first impressions and memorable moments

## Verification

To verify the migrations ran successfully, run this query in Supabase SQL Editor:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'persons' 
ORDER BY ordinal_position;
```

You should see columns including:
- `first_impression`
- `memorable_moment`
- `archived`
- `relationship_value`
- `what_i_offered`
- `what_they_offered`
- `story_completeness`

## Need Help?

If you encounter any errors when running the SQL:
1. Copy the error message
2. Check if you're running Step 1 before Step 2 (order matters!)
3. Make sure you have the necessary permissions in Supabase
4. Verify you're connected to the correct project

---

**Note**: These migrations use `ADD COLUMN IF NOT EXISTS`, so they're safe to run multiple times without causing errors.





