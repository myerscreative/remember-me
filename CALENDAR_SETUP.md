# 🔧 Calendar Integration Setup Guide

## Files Created

✅ **OAuth Routes:**
- `/app/api/auth/google/route.ts` - Google OAuth initiation
- `/app/api/auth/google/callback/route.ts` - Google OAuth callback  
- `/app/api/auth/microsoft/route.ts` - Microsoft OAuth initiation
- `/app/api/auth/microsoft/callback/route.ts` - Microsoft OAuth callback
- `/app/api/auth/refresh-token/route.ts` - Token refresh endpoint

✅ **API Endpoints:**
- `/app/api/check-meetings/route.ts` - Check for upcoming meetings
- `/app/api/meeting-notifications/route.ts` - Track notification status
- `/app/api/calendar-preferences/route.ts` - Get/update calendar settings

✅ **Notification System:**
- `/lib/notifications/meetingNotifications.ts` - Browser notification handling

✅ **Integration Updates:**
- Updated `lib/calendar/calendarIntegration.ts` to redirect to OAuth routes
- Updated `app/meeting-prep/page.tsx` to handle OAuth callbacks

---

## Environment Variables Setup

### 1. Create `.env.local` file

Create a `.env.local` file in the root of your project with the following:

```env
# Base URL (change to your production domain when deploying)
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Google Calendar OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Microsoft Calendar OAuth
NEXT_PUBLIC_MICROSOFT_CLIENT_ID=your_microsoft_client_id_here
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret_here

# Encryption Key (generate with: openssl rand -base64 32)
CALENDAR_ENCRYPTION_KEY=your_secure_random_key_here
```

---

## Google Calendar Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name it "ReMember Me Calendar" (or your preferred name)
4. Click "Create"

### Step 2: Enable Google Calendar API

1. In your project, go to "APIs & Services" → "Library"
2. Search for "Google Calendar API"
3. Click on it and press "Enable"

### Step 3: Create OAuth Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "+ CREATE CREDENTIALS" → "OAuth client ID"
3. If prompted, configure the OAuth consent screen:
   - User Type: External
   - App name: ReMember Me
   - User support email: your email
   - Developer contact: your email
   - Click "Save and Continue"
   - Scopes: Skip for now
   - Test users: Add your email
   - Click "Save and Continue"

4. Back to create OAuth client ID:
   - Application type: **Web application**
   - Name: "ReMember Me Web Client"
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/google/callback`
     - (Add production URL when ready: `https://yourdomain.com/api/auth/google/callback`)
   - Click "Create"

5. Copy the **Client ID** and **Client secret**
6. Add them to your `.env.local` file

---

## Microsoft Calendar Setup

### Step 1: Register App in Azure AD

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to "Azure Active Directory" → "App registrations"
3. Click "+ New registration"
4. Fill in:
   - Name: "ReMember Me"
   - Supported account types: "Accounts in any organizational directory and personal Microsoft accounts"
   - Redirect URI: 
     - Platform: **Web**
     - URI: `http://localhost:3000/api/auth/microsoft/callback`
   - Click "Register"

### Step 2: Add API Permissions

1. In your app, go to "API permissions"
2. Click "+ Add a permission"
3. Select "Microsoft Graph"
4. Select "Delegated permissions"
5. Search for and add:
   - `Calendars.Read`
   - `offline_access` (to get refresh token)
6. Click "Add permissions"
7. Click "Grant admin consent" (if you're an admin)

### Step 3: Create Client Secret

1. Go to "Certificates & secrets"
2. Click "+ New client secret"
3. Description: "ReMember Me Web"
4. Expires: Choose duration (recommend 12-24 months)
5. Click "Add"
6. **Copy the secret value immediately** (it won't be shown again!)

### Step 4: Copy Credentials

1. Go to "Overview"
2. Copy the **Application (client) ID**
3. Add the Application ID and Client Secret to your `.env.local` file

---

## Database Migration

Run the calendar integration migration in Supabase:

```sql
-- Go to Supabase Dashboard → SQL Editor
-- Paste the contents of: supabase/migrations/add_calendar_sync_preferences.sql
-- Click "Run"
```

This creates:
- `calendar_preferences` table (OAuth tokens, settings)
- `meeting_notifications` table (notification tracking)
- Row Level Security policies
- Automatic cleanup functions

---

## Testing the Integration

### 1. Start Development Server

```bash
cd remember-me
npm run dev
```

### 2. Navigate to Meeting Prep

Go to: http://localhost:3000/meeting-prep

### 3. Connect Google Calendar

1. Click "Connect Google Calendar"
2. You'll be redirected to Google
3. Sign in with your Google account
4. Grant calendar read permission
5. You'll be redirected back to `/meeting-prep`
6. Should see "Google Calendar connected successfully!"

### 4. Connect Microsoft Calendar

1. Click "Connect Microsoft"
2. You'll be redirected to Microsoft
3. Sign in with your Microsoft account
4. Grant calendar read permission
5. You'll be redirected back to `/meeting-prep`
6. Should see "Microsoft Calendar connected successfully!"

---

## How It Works

### OAuth Flow

```
1. User clicks "Connect Google Calendar"
   ↓
2. App redirects to /api/auth/google
   ↓
3. OAuth route redirects to Google's consent screen
   ↓
4. User grants permission
   ↓
5. Google redirects to /api/auth/google/callback with auth code
   ↓
6. Callback exchanges code for access token + refresh token
   ↓
7. Tokens stored (encrypted) in calendar_preferences table
   ↓
8. User redirected back to /meeting-prep?success=google_connected
   ↓
9. App shows success message and loads calendar events
```

### API Calls

- **Fetch Events**: `GET /api/check-meetings`
  - Called every 5 minutes (in production)
  - Gets upcoming events from Google/Microsoft
  - Matches attendees to contacts
  - Returns meetings requiring notification

- **Refresh Token**: `POST /api/auth/refresh-token`
  - Called automatically when access token expires
  - Uses refresh token to get new access token
  - Updates tokens in database

- **Update Preferences**: `PUT /api/calendar-preferences`
  - Update notification timing (5-120 minutes)
  - Toggle calendar sync on/off
  - Toggle "only known contacts" mode

---

## Security Notes

### ⚠️ IMPORTANT: Token Encryption

**Currently tokens are NOT encrypted!** This is marked with TODO comments in the code.

Before production:

1. Generate encryption key:
   ```bash
   openssl rand -base64 32
   ```

2. Add to `.env.local`:
   ```env
   CALENDAR_ENCRYPTION_KEY=your_generated_key_here
   ```

3. Implement encryption in:
   - `app/api/auth/google/callback/route.ts`
   - `app/api/auth/microsoft/callback/route.ts`
   - `app/api/auth/refresh-token/route.ts`

4. Use AES-256-GCM encryption for tokens

### Permissions Requested

- ✅ **Read calendar events only**
- ✅ **Read event attendees only**
- ❌ NO write/modify/delete permissions
- ❌ NO access to email or contacts

### Data Storage

- OAuth tokens stored encrypted in database
- Calendar events processed in real-time (not stored)
- Only matched contact IDs stored (in `meeting_notifications`)
- All data deleted when user disconnects calendar

---

## Production Checklist

Before deploying to production:

- [ ] Add production redirect URIs to Google Cloud Console
- [ ] Add production redirect URIs to Azure AD
- [ ] Update `NEXT_PUBLIC_BASE_URL` to production domain
- [ ] Implement token encryption (AES-256)
- [ ] Store encryption key securely (environment variable)
- [ ] Enable HTTPS (required for OAuth)
- [ ] Test OAuth flow on production domain
- [ ] Set up monitoring for token refresh failures
- [ ] Configure error alerts for API failures
- [ ] Test notification permissions
- [ ] Review Row Level Security policies

---

## Troubleshooting

### "Google OAuth not configured"

- Check that `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set in `.env.local`
- Restart development server after adding environment variables

### "Redirect URI mismatch"

- Ensure redirect URI in Google Console matches exactly:
  - Local: `http://localhost:3000/api/auth/google/callback`
  - Don't include trailing slash
  - Check port number (3000 vs 3001, etc.)

### "Token exchange failed"

- Check that `GOOGLE_CLIENT_SECRET` is set correctly
- Verify client secret hasn't expired
- Check browser console for detailed error

### "Calendar events not showing"

- Verify tokens are saved in `calendar_preferences` table
- Check `last_sync_error` column for error messages
- Call `/api/check-meetings` manually to test

### "Notifications not working"

- Request notification permission: `Notification.requestPermission()`
- Check browser settings allow notifications
- Verify meetings are within notification window (30 min)

---

## Next Steps

1. ✅ Set up Google OAuth credentials
2. ✅ Set up Microsoft OAuth credentials  
3. ✅ Add environment variables
4. ✅ Run database migration
5. ✅ Test OAuth flow
6. ⏳ Implement token encryption
7. ⏳ Set up notification polling
8. ⏳ Add calendar settings page
9. ⏳ Deploy to production

---

**Last Updated**: Calendar OAuth Implementation Complete
**Status**: Ready for testing (encryption pending)

