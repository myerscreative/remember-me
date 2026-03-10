import { NextRequest, NextResponse } from 'next/server';
import { GoogleCalendarService } from '@/lib/calendar/google-calendar';
import { EmailMatcher } from '@/lib/matching/email-matcher';
import { createClient } from '@/lib/supabase/server';
import { authenticateRequest } from '@/lib/supabase/auth';
import { decryptToken, isEncrypted } from '@/lib/utils/encryption';

export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await authenticateRequest(request);
    if (authError) {
      return authError;
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '7');

    const supabase = await createClient();
    const { data: prefs, error: prefsError } = await supabase
      .from('calendar_preferences')
      .select('access_token_encrypted, provider')
      .eq('user_id', user.id)
      .maybeSingle<{ access_token_encrypted: string | null; provider: string | null }>();

    if (prefsError) {
      console.error('Error fetching calendar preferences:', prefsError);
      return NextResponse.json({ error: 'Failed to read calendar connection' }, { status: 500 });
    }

    if (!prefs?.access_token_encrypted || prefs.provider !== 'google') {
      return NextResponse.json({ error: 'Calendar connection required' }, { status: 401 });
    }

    const rawAccessToken = prefs.access_token_encrypted;
    const accessToken = isEncrypted(rawAccessToken)
      ? decryptToken(rawAccessToken)
      : rawAccessToken;

    // Fetch calendar events
    const calendarService = new GoogleCalendarService(accessToken);
    const events = await calendarService.getUpcomingEvents(days);

    // Get user's contacts from Supabase
    const { data: contacts, error: contactsError } = await supabase
      .from('persons')
      .select('id, name, email, job_title, company, photo_url')
      .eq('user_id', user.id);

    if (contactsError) {
      console.error('Error fetching contacts:', contactsError);
      return NextResponse.json(
        { error: 'Failed to fetch contacts' },
        { status: 500 }
      );
    }

    // Map job_title to role for the matching interface
    type ContactRow = { id: string; name: string; email: string | null; job_title: string | null; company: string | null; photo_url: string | null };
    const contactsWithRole = ((contacts ?? []) as ContactRow[]).map(contact => ({
      id: contact.id,
      name: contact.name,
      email: contact.email,
      role: contact.job_title,
      company: contact.company,
      photo_url: contact.photo_url,
    }));

    // Match events to contacts
    const matchingResult = EmailMatcher.matchMultipleEvents(
      events,
      contactsWithRole
    );

    // Filter to only matched meetings
    const matchedMeetings = EmailMatcher.filterMatchedOnly(matchingResult);

    return NextResponse.json({
      meetings: matchedMeetings,
      stats: matchingResult.stats,
      success: true,
    });
  } catch (error: any) {
    console.error('Matched events API error:', error);
    
    return NextResponse.json(
      { error: 'Failed to match calendar events', details: error.message },
      { status: 500 }
    );
  }
}
