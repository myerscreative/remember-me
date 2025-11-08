# Supabase Setup Guide for ReMember Me

This guide walks you through setting up Supabase for the ReMember Me app.

## 🚀 Quick Setup (10 minutes)

### Step 1: Create Supabase Project (2 min)

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Name**: ReMember Me
   - **Database Password**: (generate a strong password - save it!)
   - **Region**: Choose closest to you
   - **Pricing Plan**: Free tier is perfect to start
5. Click "Create new project"
6. Wait 2 minutes for provisioning

### Step 2: Run Database Schema (3 min)

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **"+ New Query"**
3. Open the file `supabase-schema.sql` from this project
4. Copy ALL the contents (Cmd+A, Cmd+C)
5. Paste into the Supabase SQL Editor
6. Click **"Run"** (or press Cmd+Enter)
7. You should see: "Success. No rows returned"

**What this creates:**
- ✅ 6 tables (persons, tags, person_tags, relationships, attachments, interactions)
- ✅ All indexes for fast queries
- ✅ Row Level Security (RLS) policies
- ✅ Automatic timestamp updates
- ✅ Full-text search capability
- ✅ Helper functions and views

### Step 3: Set Up Storage for Attachments (2 min)

1. Go to **Storage** in left sidebar
2. Click **"Create a new bucket"**
3. Bucket name: `attachments`
4. **Public bucket**: No (keep it private)
5. Click **"Create bucket"**
6. Click on the `attachments` bucket
7. Go to **Policies** tab
8. Click **"New Policy"**
9. Create these policies:

**Policy 1: Users can upload their own files**
```sql
CREATE POLICY "Users can upload attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'attachments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**Policy 2: Users can view their own files**
```sql
CREATE POLICY "Users can view their own attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'attachments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**Policy 3: Users can delete their own files**
```sql
CREATE POLICY "Users can delete their own attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'attachments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### Step 3b: Set Up Storage for Avatars (2 min)

1. Go to **Storage** in left sidebar
2. Click **"Create a new bucket"**
3. Bucket name: `avatars`
4. **Public bucket**: Yes (avatars need to be publicly accessible for display)
5. Click **"Create bucket"**
6. Click on the `avatars` bucket
7. Go to **Policies** tab
8. Click **"New Policy"**
9. Create these policies:

**Policy 1: Users can upload their own avatars**
```sql
CREATE POLICY "Users can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**Policy 2: Anyone can view avatars (public bucket)**
```sql
CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');
```

**Policy 3: Users can delete their own avatars**
```sql
CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### Step 4: Configure Authentication (2 min)

1. Go to **Authentication** > **Providers**
2. Enable **Email** (already enabled by default)
3. Optional: Enable **Google**, **GitHub**, etc.
4. Go to **Authentication** > **URL Configuration**
5. Add your site URL:
   - **Development**: `http://localhost:3000`
   - **Production**: Your actual domain
6. Add redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `https://yourdomain.com/auth/callback`

### Step 5: Get Your API Credentials (1 min)

1. Go to **Settings** > **API**
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbG...` (long string)

### Step 6: Add to Your App (1 min)

Create `.env.local` in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

Replace with your actual values from Step 5.

### Step 7: Test It! (1 min)

```bash
npm run dev
```

Open http://localhost:3000 and the app should now be connected to Supabase!

## 📊 Database Schema Overview

### persons table
Main contact information including:
- Basic details (name, email, phone, LinkedIn)
- Context (where met, who introduced, when)
- Insights (why stay in contact, interests, what's important to them)
- Notes (family, general notes)
- Tracking (last contact, follow-up reminders)

### tags table
User-defined tags with colors for organizing contacts
- Examples: Friend, Family, Work, Client, etc.

### person_tags table
Links persons to tags (many-to-many)

### relationships table
Defines how contacts know each other:
- Relationship type (colleague, friend, family)
- Direction (bidirectional, one-way)
- Context

### attachments table
Store files related to contacts:
- Voice notes
- Documents
- Images
- Files stored in Supabase Storage

### interactions table
Log of all contact interactions:
- Type (meeting, call, email, message)
- Date, notes, location, duration
- Auto-updates person.last_contact

## 🔍 Using Full-Text Search

The schema includes full-text search! Use it like this:

```sql
-- Search for persons
SELECT * FROM search_persons('john developer', auth.uid());

-- This searches across:
-- - name
-- - email  
-- - notes
-- - where_met
-- - what_found_interesting
```

In your app, you can call this from the Supabase client:

```typescript
const { data } = await supabase
  .rpc('search_persons', {
    search_query: 'john',
    current_user_id: user.id
  });
```

## 📝 Helper Functions Included

### Get Follow-Up Reminders
```sql
SELECT * FROM get_follow_up_reminders(auth.uid());
```

Returns all persons with follow_up_reminder dates that have passed.

### Persons with Tags View
```sql
SELECT * FROM persons_with_tags;
```

Returns persons with their tag names and colors as arrays.

### Interaction Counts View
```sql
SELECT * FROM person_interaction_counts;
```

Returns statistics about interactions per person.

## 🔐 Security Features

### Row Level Security (RLS)
All tables have RLS enabled. Users can only:
- See their own data
- Modify their own data
- Not access other users' data

### Data Validation
Built-in checks for:
- Valid email formats
- No empty names/tags
- Valid color codes
- No self-relationships
- Positive durations

### Automatic Triggers
- `updated_at` auto-updates on record changes
- `last_contact` auto-updates when interactions are logged

## 🧪 Testing Your Setup

### Test 1: Create a Person
```sql
INSERT INTO persons (user_id, name, email)
VALUES (auth.uid(), 'Test Contact', 'test@example.com');
```

### Test 2: Create Tags
```sql
INSERT INTO tags (user_id, name, color)
VALUES 
  (auth.uid(), 'Friend', '#8b5cf6'),
  (auth.uid(), 'Work', '#10b981');
```

### Test 3: Tag a Person
```sql
INSERT INTO person_tags (person_id, tag_id)
VALUES (
  (SELECT id FROM persons WHERE name = 'Test Contact' LIMIT 1),
  (SELECT id FROM tags WHERE name = 'Friend' LIMIT 1)
);
```

### Test 4: Log an Interaction
```sql
INSERT INTO interactions (user_id, person_id, interaction_type, title, notes)
VALUES (
  auth.uid(),
  (SELECT id FROM persons WHERE name = 'Test Contact' LIMIT 1),
  'meeting',
  'Coffee chat',
  'Discussed project ideas'
);
```

Check if `last_contact` was automatically updated:
```sql
SELECT name, last_contact FROM persons WHERE name = 'Test Contact';
```

## 🐛 Troubleshooting

### "relation does not exist"
- Make sure you ran the entire schema SQL
- Refresh the Supabase dashboard

### "permission denied for table"
- RLS is working! You need to be authenticated
- Make sure auth.uid() is set

### "cannot insert NULL value"
- Check required fields: user_id, name (for persons)
- Ensure you're passing all NOT NULL fields

### Search not working
- Run: `CREATE EXTENSION IF NOT EXISTS "pg_trgm";`
- Check that the indexes were created

## 📚 Next Steps

1. ✅ Database is set up
2. ✅ Storage bucket configured
3. ✅ Authentication enabled
4. ➡️ Build authentication pages in your app
5. ➡️ Connect forms to database
6. ➡️ Test on real data

## 🔗 Useful Resources

- [Supabase Docs](https://supabase.com/docs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Full-Text Search](https://supabase.com/docs/guides/database/full-text-search)
- [Storage](https://supabase.com/docs/guides/storage)

## 💡 Tips

- Use the **Table Editor** in Supabase dashboard to view/edit data
- Use **SQL Editor** for complex queries
- Check **Database** > **Roles** to see permissions
- Monitor usage in **Settings** > **Usage**

---

**You're all set!** Your database is production-ready 🎉

