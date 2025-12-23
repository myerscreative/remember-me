import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { GoogleCalendarService } from '@/lib/calendar/google-calendar';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const calendarService = new GoogleCalendarService(session.accessToken);
    const events = await calendarService.getUpcomingEvents();

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Calendar API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to fetch calendar events: ${errorMessage}` },
      { status: 500 }
    );
  }
}
