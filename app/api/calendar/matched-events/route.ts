import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { GoogleCalendarService } from '@/lib/calendar/google-calendar';
import { EmailMatcher } from '@/lib/matching/email-matcher';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

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

    // Get user's contacts from Supabase using service role key
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: contacts, error: contactsError } = await supabase
      .from('persons')
      .select('id, name, email, job_title, company, photo_url')
      .eq('user_id', session.user.id);

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
