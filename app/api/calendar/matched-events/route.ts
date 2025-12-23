import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { GoogleCalendarService } from '@/lib/calendar/google-calendar';
import { EmailMatcher } from '@/lib/matching/email-matcher';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated session
    const session = await getCurrentSession();
    
    if (!session?.accessToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '7');

    // Fetch calendar events
    const calendarService = new GoogleCalendarService(session.accessToken);
    const events = await calendarService.getUpcomingEvents(days);

    // Get user's contacts from Supabase
    const supabase = await createClient();
    const { data: contacts, error: contactsError } = await supabase
      .from('persons')
      .select('id, name, email, role, company, photo_url')
      .eq('user_id', session.user.id);

    if (contactsError) {
      console.error('Error fetching contacts:', contactsError);
      return NextResponse.json(
        { error: 'Failed to fetch contacts' },
        { status: 500 }
      );
    }

    // Match events to contacts
    const matchingResult = EmailMatcher.matchMultipleEvents(
      events,
      contacts || []
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
