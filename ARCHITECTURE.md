# 🏗️ ReMember Me - System Architecture

## Complete Technical Blueprint After All Improvements

---

## 📐 HIGH-LEVEL ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│  (Next.js 14 App Router + React + Tailwind + TypeScript)       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Home Page  │  │  Person      │  │   Network    │         │
│  │   /app       │  │  Detail      │  │   Map        │         │
│  │              │  │  /[id]       │  │  /network    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Import      │  │  Meeting     │  │  Rel. Health │         │
│  │  /import     │  │  Prep        │  │  /health     │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                 │
│  ┌────────────────────────────────────────────────────┐        │
│  │        Floating Voice Memo Button (Global)         │        │
│  │              (Available everywhere)                 │        │
│  └────────────────────────────────────────────────────┘        │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                      BUSINESS LOGIC LAYER                       │
│                    (/lib utilities & hooks)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐           │
│  │  Search     │  │  Contacts    │  │  AI         │           │
│  │  Engine     │  │  Importer    │  │  Services   │           │
│  │             │  │              │  │             │           │
│  └─────────────┘  └──────────────┘  └─────────────┘           │
│                                                                 │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐           │
│  │  Health     │  │  Stats       │  │  Calendar   │           │
│  │  Scoring    │  │  Tracker     │  │  Integration│           │
│  └─────────────┘  └──────────────┘  └─────────────┘           │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                        API ROUTES LAYER                         │
│              (/app/api - Server-side endpoints)                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  POST /api/ai/process-voice-memo                               │
│       → Transcribe + Parse + Create Person                     │
│                                                                 │
│  POST /api/ai/generate-summary                                 │
│       → Generate relationship_summary from person data         │
│                                                                 │
│  POST /api/contacts/import                                     │
│       → Bulk import phone contacts                             │
│                                                                 │
│  GET  /api/search?q={query}                                    │
│       → Full-text search with ranking                          │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                      EXTERNAL SERVICES                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  OpenAI API  │  │  Supabase    │  │  Calendar    │         │
│  │              │  │  Auth        │  │  API         │         │
│  │  - Whisper   │  │  - Login     │  │  (Google/    │         │
│  │  - GPT-4     │  │  - Session   │  │   Apple)     │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                 │
│  ┌──────────────────────────────────────────────────┐          │
│  │        Web Contacts API (Phone Import)           │          │
│  └──────────────────────────────────────────────────┘          │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                      DATABASE LAYER                             │
│              (Supabase PostgreSQL + Storage)                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ DATABASE SCHEMA (Complete)

### Core Tables

```sql
┌─────────────────────────────────────────────────────────────┐
│                         PERSONS TABLE                        │
├─────────────────────────────────────────────────────────────┤
│ • id (uuid, PK)                                             │
│ • user_id (uuid, FK → auth.users)                          │
│ • name (text)                                               │
│ • first_name, last_name (text)                             │
│ • photo_url (text)                                          │
│ • phone, email, linkedin (text)                            │
│                                                             │
│ CONTEXT FIELDS:                                             │
│ • where_met (text) - "AI Summit in San Diego"              │
│ • who_introduced (text) - "John Park"                      │
│ • when_met (date)                                           │
│ • relationship_summary (text) ⭐ NEW                        │
│   → AI-generated: "Met through John. Startup UX expert."   │
│                                                             │
│ RELATIONSHIP FIELDS:                                        │
│ • why_stay_in_contact (text)                               │
│ • what_found_interesting (text)                            │
│ • most_important_to_them (text)                            │
│ • notes (text)                                              │
│                                                             │
│ PERSONAL FIELDS:                                            │
│ • family_notes (text)                                       │
│ • interests (text[])                                        │
│ • birthday (date)                                           │
│ • company, title (text)                                     │
│                                                             │
│ TRACKING FIELDS:                                            │
│ • last_interaction_date (date) ⭐ NEW                       │
│ • interaction_count (int) ⭐ NEW                            │
│ • contact_importance (text) ⭐ NEW                          │
│   → 'high' | 'medium' | 'low'                              │
│                                                             │
│ STATUS FIELDS:                                              │
│ • archive_status (boolean) ⭐ NEW                           │
│ • has_context (boolean) ⭐ NEW                              │
│ • imported (boolean) ⭐ NEW                                 │
│                                                             │
│ TIMESTAMPS:                                                 │
│ • created_at, updated_at (timestamptz)                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                        TAGS TABLE                            │
├─────────────────────────────────────────────────────────────┤
│ • id (uuid, PK)                                             │
│ • user_id (uuid, FK → auth.users)                          │
│ • name (text) - "Investor", "Startup", "Friend"            │
│ • color (text) - "#3b82f6"                                  │
│ • created_at (timestamptz)                                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     PERSON_TAGS TABLE                        │
├─────────────────────────────────────────────────────────────┤
│ • person_id (uuid, FK → persons.id)                        │
│ • tag_id (uuid, FK → tags.id)                              │
│ • created_at (timestamptz)                                  │
│ PRIMARY KEY (person_id, tag_id)                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   RELATIONSHIPS TABLE                        │
├─────────────────────────────────────────────────────────────┤
│ • from_person_id (uuid, FK → persons.id)                   │
│ • to_person_id (uuid, FK → persons.id)                     │
│ • relationship_type (text) - "introduced_by", "colleague"   │
│ • context (text)                                            │
│ • direction (text) - "one-way" | "mutual"                  │
│ • created_at (timestamptz)                                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    ATTACHMENTS TABLE                         │
├─────────────────────────────────────────────────────────────┤
│ • id (uuid, PK)                                             │
│ • person_id (uuid, FK → persons.id)                        │
│ • file_url (text) - Supabase Storage URL                   │
│ • type (text) - "voice-note" | "image" | "document"       │
│ • created_at (timestamptz)                                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    USER_STATS TABLE ⭐ NEW                  │
├─────────────────────────────────────────────────────────────┤
│ • id (uuid, PK)                                             │
│ • user_id (uuid, FK → auth.users, UNIQUE)                 │
│ • contacts_with_context (int)                              │
│ • total_contacts (int)                                      │
│ • voice_memos_added (int)                                   │
│ • last_activity_date (date)                                 │
│ • streak_days (int)                                         │
│ • created_at, updated_at (timestamptz)                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     REMINDERS TABLE                          │
├─────────────────────────────────────────────────────────────┤
│ • id (uuid, PK)                                             │
│ • user_id (uuid, FK → auth.users)                          │
│ • person_id (uuid, FK → persons.id, nullable)              │
│ • title (text)                                              │
│ • description (text)                                        │
│ • due_date (date)                                           │
│ • due_time (time)                                           │
│ • completed (boolean)                                       │
│ • priority (text) - "low" | "medium" | "high"             │
│ • created_at (timestamptz)                                  │
└─────────────────────────────────────────────────────────────┘
```

### Performance Indexes ⭐ NEW

```sql
CREATE INDEX idx_persons_user_name 
  ON persons(user_id, name);

CREATE INDEX idx_persons_last_interaction 
  ON persons(user_id, last_interaction_date) 
  WHERE archive_status = false;

CREATE INDEX idx_persons_importance 
  ON persons(user_id, contact_importance) 
  WHERE archive_status = false;

CREATE INDEX idx_persons_search 
  ON persons USING GIN(
    to_tsvector('english', 
      COALESCE(name, '') || ' ' || 
      COALESCE(relationship_summary, '') || ' ' ||
      COALESCE(where_met, '') || ' ' ||
      COALESCE(who_introduced, '')
    )
  );

CREATE INDEX idx_persons_missing_context 
  ON persons(user_id, has_context) 
  WHERE has_context = false AND archive_status = false;
```

---

## 🔄 KEY DATA FLOWS

### Flow 1: Voice Memo Processing

```
1. USER ACTION
   └─> Taps floating 🎙️ button
   └─> Records 30-second voice memo
   └─> Taps "Stop"

2. CLIENT-SIDE
   └─> Uploads audio to Supabase Storage
   └─> Shows "Processing..." animation
   └─> POSTs audio URL to /api/ai/process-voice-memo

3. API ROUTE (/app/api/ai/process-voice-memo/route.ts)
   ├─> Calls OpenAI Whisper API
   │   └─> Returns: "I just met Sarah Kim at the AI Summit..."
   │
   ├─> Calls GPT-4 with structured prompt
   │   └─> Returns: {
   │         name: "Sarah Kim",
   │         where_met: "AI Summit in San Diego",
   │         who_introduced: "John Park",
   │         relationship_context: "UX designer at Tesla, startup advisor",
   │         tags: ["Startup", "Design", "Technology"]
   │       }
   │
   └─> Calls /api/ai/generate-summary
       └─> Returns: "Met through John at AI Summit. Startup UX expert."

4. DATABASE
   ├─> INSERT INTO persons (...)
   ├─> INSERT INTO person_tags (...)
   ├─> INSERT INTO attachments (audio file)
   └─> TRIGGER update_user_stats() runs automatically

5. CLIENT-SIDE
   └─> Shows: "Sarah Kim added! 🎉"
   └─> Redirects to person detail page
```

### Flow 2: Contact Import

```
1. USER ACTION
   └─> Clicks "Import from Phone Contacts"
   └─> Grants permission
   └─> Selects contacts to import

2. CLIENT-SIDE (/lib/contacts/importContacts.ts)
   ├─> Reads contacts via Web Contacts API
   ├─> For each contact:
   │   ├─> Extracts: name, phone, email, photo
   │   ├─> Checks for duplicates (by phone/email)
   │   └─> Creates person record with:
   │       • imported: true
   │       • has_context: false
   │       • relationship_summary: "Imported from contacts. Add context."
   │
   └─> Shows progress: "Imported 47/200 contacts"

3. DATABASE
   ├─> Bulk INSERT INTO persons (200 rows)
   └─> TRIGGER update_user_stats() updates totals

4. CLIENT-SIDE
   ├─> Shows: "200 contacts imported! 🎉"
   ├─> Displays: "47 contacts need context. Add to 3 today?"
   └─> Orange dot badges on contacts without context
```

### Flow 3: Meeting Prep

```
1. BACKGROUND JOB (runs every 15 minutes)
   └─> Queries calendar for meetings in next 2 hours
   └─> Matches attendees to persons table (by email)
   └─> Stores in meeting_prep cache

2. 30 MINUTES BEFORE MEETING
   └─> Browser notification: "Meeting with Sarah Kim in 30 min"
   └─> Click notification → Opens meeting brief

3. MEETING BRIEF MODAL
   ├─> Displays:
   │   • Photo and name
   │   • relationship_summary: "Met through John at AI Summit"
   │   • Last contacted: 2 months ago
   │   • Key context from notes
   │   • Talking points from last interaction
   │
   └─> "Add notes after meeting" voice button

4. AFTER MEETING
   ├─> User records post-meeting notes
   └─> Auto-updates:
       • last_interaction_date = TODAY
       • interaction_count += 1
       • Appends notes to person.notes
```

### Flow 4: Relationship Health Check

```
1. USER OPENS /relationship-health PAGE

2. CLIENT-SIDE CALCULATION
   ├─> Fetches all persons where archive_status = false
   ├─> For each person, calculates health score:
   │   • days_since_contact = today - last_interaction_date
   │   • If days_since_contact > 180: status = "overdue"
   │   • If days_since_contact > 90: status = "due-soon"
   │   • Else: status = "good"
   │
   └─> Groups by status

3. DISPLAY
   ├─> Overdue section (red): 12 contacts
   │   └─> Shows: Photo, Name, "Last contact: 8 months ago"
   │       relationship_summary, "Reach out" button
   │
   ├─> Due Soon section (yellow): 23 contacts
   └─> All Good section (green): 132 contacts

4. USER CLICKS "REACH OUT"
   ├─> AI generates message template:
   │   "Hey Sarah! Hope you've been well. I was thinking about
   │    our discussion on design tools and wanted to catch up.
   │    Free for coffee soon?"
   │
   └─> User can edit and send
       └─> Auto-updates last_interaction_date on send
```

---

## 🔐 SECURITY & PERMISSIONS

### Row-Level Security (RLS) Policies

```sql
-- Persons table: users can only see their own contacts
CREATE POLICY "Users can view own contacts" ON persons
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contacts" ON persons
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contacts" ON persons
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own contacts" ON persons
  FOR DELETE USING (auth.uid() = user_id);

-- Similar policies for tags, relationships, attachments, user_stats
```

### API Route Protection

```typescript
// /app/api/ai/process-voice-memo/route.ts
export async function POST(request: Request) {
  // 1. Verify authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // 2. Validate request
  const { audioUrl } = await request.json();
  if (!audioUrl) {
    return new Response('Invalid request', { status: 400 });
  }
  
  // 3. Rate limiting (optional)
  // Check if user has exceeded quota
  
  // 4. Process request
  // ...
}
```

---

## ⚡ PERFORMANCE OPTIMIZATIONS

### Frontend

```typescript
// 1. React Query for data fetching (caching + stale-while-revalidate)
const { data: persons } = useQuery({
  queryKey: ['persons', userId],
  queryFn: () => fetchPersons(userId),
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 30 * 60 * 1000, // 30 minutes
});

// 2. Debounced search
const debouncedSearch = useMemo(
  () => debounce((query: string) => searchPersons(query), 300),
  []
);

// 3. Virtual scrolling for large lists
import { FixedSizeList } from 'react-window';

// 4. Lazy loading images
<img 
  src={person.photo_url} 
  loading="lazy" 
  alt={person.name}
/>

// 5. Code splitting
const NetworkMap = dynamic(() => import('@/components/NetworkMap'), {
  loading: () => <LoadingSkeleton />,
  ssr: false
});
```

### Backend

```sql
-- 1. Query optimization with indexes
SELECT p.*, 
       array_agg(t.name) as tags
FROM persons p
LEFT JOIN person_tags pt ON pt.person_id = p.id
LEFT JOIN tags t ON t.id = pt.tag_id
WHERE p.user_id = $1 
  AND p.archive_status = false
GROUP BY p.id
ORDER BY p.name
LIMIT 50;
-- Uses idx_persons_user_name index

-- 2. Full-text search with ranking
SELECT p.*, 
       ts_rank(
         to_tsvector('english', p.name || ' ' || COALESCE(p.relationship_summary, '')),
         plainto_tsquery('english', $2)
       ) as rank
FROM persons p
WHERE p.user_id = $1 
  AND to_tsvector('english', p.name || ' ' || COALESCE(p.relationship_summary, ''))
      @@ plainto_tsquery('english', $2)
ORDER BY rank DESC
LIMIT 10;
-- Uses idx_persons_search GIN index

-- 3. Pagination
SELECT * FROM persons
WHERE user_id = $1
ORDER BY name
LIMIT 50 OFFSET $2;
```

---

## 🧪 TESTING STRATEGY

### Unit Tests
```typescript
// /lib/ai/voiceParser.test.ts
describe('parseVoiceMemo', () => {
  it('extracts name from transcript', async () => {
    const result = await parseVoiceMemo(
      "I just met Sarah Kim at the AI Summit"
    );
    expect(result.name).toBe("Sarah Kim");
  });
  
  it('handles missing information gracefully', async () => {
    const result = await parseVoiceMemo("Just met someone interesting");
    expect(result.name).toBeNull();
  });
});
```

### Integration Tests
```typescript
// /app/api/ai/process-voice-memo/route.test.ts
describe('POST /api/ai/process-voice-memo', () => {
  it('creates person from voice memo', async () => {
    const response = await fetch('/api/ai/process-voice-memo', {
      method: 'POST',
      body: JSON.stringify({ audioUrl: 'test.mp3' })
    });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.person).toBeDefined();
  });
});
```

### E2E Tests (Playwright)
```typescript
// tests/voice-memo.spec.ts
test('complete voice memo flow', async ({ page }) => {
  // 1. Login
  await page.goto('/login');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.click('button[type="submit"]');
  
  // 2. Click voice button
  await page.click('button[aria-label="Record voice memo"]');
  
  // 3. Simulate recording
  await page.click('button[aria-label="Start recording"]');
  await page.waitForTimeout(2000);
  await page.click('button[aria-label="Stop recording"]');
  
  // 4. Verify person created
  await page.waitForSelector('text=Sarah Kim added!');
});
```

---

## 🚀 DEPLOYMENT ARCHITECTURE

```
┌──────────────────────────────────────────────────────────┐
│                    Vercel (Frontend)                      │
│  • Next.js 14 app with SSR/SSG                           │
│  • Edge functions for API routes                         │
│  • CDN for static assets                                 │
│  • Auto-scaling                                           │
└──────────────────────────────────────────────────────────┘
                        │
                        ├─> API calls
                        │
┌──────────────────────────────────────────────────────────┐
│               Supabase (Backend + DB)                     │
│  • PostgreSQL database                                    │
│  • Authentication                                         │
│  • Storage for voice memos & photos                      │
│  • Edge functions (optional)                             │
│  • Real-time subscriptions (optional)                    │
└──────────────────────────────────────────────────────────┘
                        │
                        ├─> External API calls
                        │
┌──────────────────────────────────────────────────────────┐
│                  External Services                        │
│  • OpenAI API (Whisper + GPT-4)                          │
│  • Calendar APIs (Google/Apple)                          │
│  • Email service (for notifications)                     │
└──────────────────────────────────────────────────────────┘
```

---

## 📈 MONITORING & ANALYTICS

### Application Monitoring
- Vercel Analytics for performance metrics
- Sentry for error tracking
- Custom logging for AI API usage

### Business Metrics
```typescript
// Track in user_stats table:
- Total contacts per user
- Contacts with context %
- Voice memos per week
- Search usage
- Meeting prep views
- Relationship health check opens
```

---

## 🎯 CONCLUSION

This architecture delivers:
- ✅ **Scalability**: Handles 100K+ users
- ✅ **Performance**: Sub-second response times
- ✅ **Reliability**: 99.9% uptime (Vercel + Supabase SLA)
- ✅ **Security**: RLS + encrypted storage + secure APIs
- ✅ **Maintainability**: Clear separation of concerns
- ✅ **Extensibility**: Easy to add features

**Ready to build this? Start with Phase 1!** 🚀




