import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { GoogleCalendarService } from '@/lib/calendar/google-calendar';
import { createClient } from '@/lib/supabase/server';
import { decryptToken, isEncrypted } from '@/lib/utils/encryption';

export async function GET(_request: NextRequest) {
  const session = await getServerSession(authOptions);
  let accessToken = session?.accessToken;
  const userId = session?.user?.id;

  if (!accessToken && !userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // If session doesn't have token, try database
  if (!accessToken && userId) {
    try {
      const supabase = await createClient();
      const { data: prefs, error: prefsError } = await supabase
        .from('calendar_preferences')
        .select('access_token_encrypted, provider')
        .eq('user_id', userId)
        .maybeSingle<{ access_token_encrypted: string | null; provider: string | null }>();
      
      if (prefsError) {
        console.error('Error fetching calendar preferences:', prefsError);
      }

      if (prefs?.access_token_encrypted && prefs.provider === 'google') {
        const encrypted = prefs.access_token_encrypted;
        accessToken = isEncrypted(encrypted) ? decryptToken(encrypted) : encrypted;
      }
    } catch (err) {
      console.error('Error fetching token from database:', err);
    }
  }

  if (!accessToken) {
    return NextResponse.json({ 
      error: 'Calendar connection required',
      code: 'NO_TOKEN'
    }, { status: 401 });
  }

  try {
    const calendarService = new GoogleCalendarService(accessToken);
    const events = await calendarService.getUpcomingEvents();

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Calendar API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Check if token is invalid/expired
    if (
      errorMessage.toLowerCase().includes('invalid_grant') || 
      errorMessage.toLowerCase().includes('unauthorized') ||
      errorMessage.toLowerCase().includes('invalid_token') ||
      errorMessage.toLowerCase().includes('expired')
    ) {
      return NextResponse.json(
        { error: 'Calendar session expired. Please reconnect.', code: 'TOKEN_EXPIRED' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: `Failed to fetch calendar events: ${errorMessage}` },
      { status: 500 }
    );
  }
}
