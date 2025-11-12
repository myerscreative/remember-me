// Calendar Integration - Google Calendar and Microsoft Outlook support

import type {
  CalendarEvent,
  CalendarProvider,
  CalendarPermissionResult,
  CalendarSyncStatus,
  CalendarError,
  GoogleCalendar,
  MicrosoftCalendar,
} from "@/types/calendar";

/**
 * Request calendar permission from user
 *
 * This function initiates OAuth flow for the specified provider
 *
 * @param provider - Calendar provider to use
 * @returns Permission result with status and error details
 *
 * @example
 * const result = await requestCalendarPermission('google');
 * if (result.granted) {
 *   // Proceed with calendar sync
 * }
 */
export async function requestCalendarPermission(
  provider: CalendarProvider
): Promise<CalendarPermissionResult> {
  try {
    if (provider === 'google') {
      return await requestGoogleCalendarPermission();
    } else if (provider === 'microsoft') {
      return await requestMicrosoftCalendarPermission();
    } else {
      return {
        granted: false,
        provider,
        error: 'UNSUPPORTED_PROVIDER',
        userMessage: `${provider} calendar is not yet supported. Please use Google or Microsoft calendar.`,
      };
    }
  } catch (error: any) {
    console.error('Error requesting calendar permission:', error);
    return {
      granted: false,
      provider,
      error: error.message,
      userMessage: 'Failed to request calendar permission. Please try again.',
    };
  }
}

/**
 * Request Google Calendar permission via OAuth
 *
 * @returns Permission result
 */
async function requestGoogleCalendarPermission(): Promise<CalendarPermissionResult> {
  // Check if Google API is loaded
  if (typeof window === 'undefined' || !window.gapi) {
    return {
      granted: false,
      provider: 'google',
      error: 'GOOGLE_API_NOT_LOADED',
      userMessage: 'Google Calendar API is not loaded. Please refresh the page.',
    };
  }

  try {
    // Initialize Google API client
    // Note: This requires GOOGLE_CLIENT_ID to be set in environment
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    if (!clientId) {
      return {
        granted: false,
        provider: 'google',
        error: 'MISSING_CLIENT_ID',
        userMessage: 'Google Calendar is not configured. Please contact support.',
      };
    }

    // Google OAuth flow would happen here
    // For now, return a placeholder
    return {
      granted: false,
      provider: 'google',
      error: 'NOT_IMPLEMENTED',
      userMessage: 'Google Calendar integration coming soon. Please check back later.',
    };
  } catch (error: any) {
    return {
      granted: false,
      provider: 'google',
      error: error.message,
      userMessage: 'Failed to connect to Google Calendar. Please try again.',
    };
  }
}

/**
 * Request Microsoft Calendar permission via OAuth
 *
 * @returns Permission result
 */
async function requestMicrosoftCalendarPermission(): Promise<CalendarPermissionResult> {
  const clientId = process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID;

  if (!clientId) {
    return {
      granted: false,
      provider: 'microsoft',
      error: 'MISSING_CLIENT_ID',
      userMessage: 'Microsoft Calendar is not configured. Please contact support.',
    };
  }

  // Microsoft OAuth flow would happen here
  return {
    granted: false,
    provider: 'microsoft',
    error: 'NOT_IMPLEMENTED',
    userMessage: 'Microsoft Calendar integration coming soon. Please check back later.',
  };
}

/**
 * Fetch upcoming calendar events
 *
 * @param provider - Calendar provider
 * @param accessToken - OAuth access token
 * @param daysAhead - Number of days to fetch (default: 7)
 * @returns Array of calendar events
 *
 * @throws CalendarError if fetch fails
 *
 * @example
 * const events = await fetchUpcomingEvents('google', token, 7);
 * console.log(`Found ${events.length} upcoming events`);
 */
export async function fetchUpcomingEvents(
  provider: CalendarProvider,
  accessToken: string,
  daysAhead: number = 7
): Promise<CalendarEvent[]> {
  try {
    if (provider === 'google') {
      return await fetchGoogleCalendarEvents(accessToken, daysAhead);
    } else if (provider === 'microsoft') {
      return await fetchMicrosoftCalendarEvents(accessToken, daysAhead);
    } else {
      throw new Error(`Unsupported provider: ${provider}`);
    }
  } catch (error: any) {
    console.error(`Error fetching ${provider} calendar events:`, error);
    throw error;
  }
}

/**
 * Fetch Google Calendar events
 *
 * @param accessToken - Google OAuth access token
 * @param daysAhead - Number of days to fetch
 * @returns Array of calendar events
 */
async function fetchGoogleCalendarEvents(
  accessToken: string,
  daysAhead: number
): Promise<CalendarEvent[]> {
  const now = new Date();
  const endDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  const params = new URLSearchParams({
    timeMin: now.toISOString(),
    timeMax: endDate.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '50',
  });

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('AUTH_EXPIRED');
    }
    throw new Error(`Google Calendar API error: ${response.statusText}`);
  }

  const data: GoogleCalendar.ListResponse = await response.json();

  return data.items.map(event => convertGoogleEvent(event));
}

/**
 * Fetch Microsoft Calendar events
 *
 * @param accessToken - Microsoft OAuth access token
 * @param daysAhead - Number of days to fetch
 * @returns Array of calendar events
 */
async function fetchMicrosoftCalendarEvents(
  accessToken: string,
  daysAhead: number
): Promise<CalendarEvent[]> {
  const now = new Date();
  const endDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  const params = new URLSearchParams({
    startDateTime: now.toISOString(),
    endDateTime: endDate.toISOString(),
    $orderby: 'start/dateTime',
    $top: '50',
  });

  const response = await fetch(
    `https://graph.microsoft.com/v1.0/me/calendarview?${params}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('AUTH_EXPIRED');
    }
    throw new Error(`Microsoft Graph API error: ${response.statusText}`);
  }

  const data: MicrosoftCalendar.ListResponse = await response.json();

  return data.value.map(event => convertMicrosoftEvent(event));
}

/**
 * Convert Google Calendar event to standard CalendarEvent format
 *
 * @param event - Google Calendar event
 * @returns Standardized CalendarEvent
 */
function convertGoogleEvent(event: GoogleCalendar.Event): CalendarEvent {
  const start = event.start.dateTime
    ? new Date(event.start.dateTime)
    : new Date(event.start.date || '');

  const end = event.end.dateTime
    ? new Date(event.end.dateTime)
    : new Date(event.end.date || '');

  const attendees = (event.attendees || []).map(attendee => ({
    email: attendee.email,
    name: attendee.displayName,
    responseStatus: attendee.responseStatus as any,
    organizer: attendee.organizer,
    optional: attendee.optional,
  }));

  return {
    id: event.id,
    title: event.summary,
    description: event.description,
    start,
    end,
    location: event.location,
    meetingLink: event.hangoutLink,
    attendees,
    provider: 'google',
    allDay: !event.start.dateTime,
    organizerEmail: event.organizer?.email,
    status: event.status as any,
    rawData: event,
  };
}

/**
 * Convert Microsoft Calendar event to standard CalendarEvent format
 *
 * @param event - Microsoft Calendar event
 * @returns Standardized CalendarEvent
 */
function convertMicrosoftEvent(event: MicrosoftCalendar.Event): CalendarEvent {
  const start = new Date(event.start.dateTime);
  const end = new Date(event.end.dateTime);

  const attendees = (event.attendees || []).map(attendee => ({
    email: attendee.emailAddress.address,
    name: attendee.emailAddress.name,
    responseStatus: attendee.status?.response as any,
    organizer: false,
    optional: attendee.type === 'optional',
  }));

  return {
    id: event.id,
    title: event.subject,
    description: event.bodyPreview,
    start,
    end,
    location: event.location?.displayName,
    meetingLink: event.onlineMeetingUrl,
    attendees,
    provider: 'microsoft',
    allDay: event.isAllDay || false,
    organizerEmail: event.organizer?.emailAddress.address,
    status: event.isCancelled ? 'cancelled' : 'confirmed',
    rawData: event,
  };
}

/**
 * Get calendar sync status
 *
 * Checks if calendar is connected and returns sync information
 *
 * @returns Calendar sync status
 */
export async function getCalendarSyncStatus(): Promise<CalendarSyncStatus> {
  try {
    // Check localStorage for stored credentials (in real app, use secure storage)
    const storedProvider = localStorage.getItem('calendar_provider') as CalendarProvider | null;
    const storedToken = localStorage.getItem('calendar_access_token');

    if (!storedProvider || !storedToken) {
      return {
        enabled: false,
        hasPermission: false,
      };
    }

    // Try to fetch a small number of events to verify token
    try {
      const events = await fetchUpcomingEvents(storedProvider, storedToken, 1);

      return {
        enabled: true,
        hasPermission: true,
        provider: storedProvider,
        lastSync: new Date(),
        upcomingEventsCount: events.length,
      };
    } catch (error: any) {
      if (error.message === 'AUTH_EXPIRED') {
        return {
          enabled: true,
          hasPermission: false,
          provider: storedProvider,
          error: 'Authentication expired. Please reconnect your calendar.',
        };
      }

      return {
        enabled: true,
        hasPermission: false,
        provider: storedProvider,
        error: 'Failed to sync calendar. Please check your connection.',
      };
    }
  } catch (error: any) {
    return {
      enabled: false,
      hasPermission: false,
      error: error.message,
    };
  }
}

/**
 * Disconnect calendar
 *
 * Revokes permissions and clears stored credentials
 *
 * @returns True if successfully disconnected
 */
export async function disconnectCalendar(): Promise<boolean> {
  try {
    // Clear stored credentials
    localStorage.removeItem('calendar_provider');
    localStorage.removeItem('calendar_access_token');
    localStorage.removeItem('calendar_refresh_token');

    return true;
  } catch (error) {
    console.error('Error disconnecting calendar:', error);
    return false;
  }
}

/**
 * Check if calendar integration is supported in current browser
 *
 * @returns True if supported
 */
export function isCalendarSupported(): boolean {
  if (typeof window === 'undefined') return false;

  // Check for required APIs
  return (
    'fetch' in window &&
    'localStorage' in window
  );
}

/**
 * Get user-friendly error message for calendar errors
 *
 * @param error - Error object
 * @returns User-friendly message
 */
export function getCalendarErrorMessage(error: any): string {
  if (error.message === 'AUTH_EXPIRED') {
    return 'Your calendar connection has expired. Please reconnect your calendar in settings.';
  }

  if (error.message === 'PERMISSION_DENIED') {
    return 'Calendar permission was denied. Please allow calendar access to use this feature.';
  }

  if (error.message === 'NETWORK_ERROR') {
    return 'Unable to connect to calendar service. Please check your internet connection.';
  }

  if (error.message === 'RATE_LIMIT') {
    return 'Too many requests to calendar service. Please try again in a few minutes.';
  }

  return 'An error occurred while accessing your calendar. Please try again.';
}

/**
 * Format date range for display
 *
 * @param start - Start date
 * @param end - End date
 * @returns Formatted string (e.g., "Today 2:00 PM - 3:00 PM")
 */
export function formatEventTimeRange(start: Date, end: Date): string {
  const now = new Date();
  const isToday = start.toDateString() === now.toDateString();

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = start.toDateString() === tomorrow.toDateString();

  const startTime = start.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const endTime = end.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  if (isToday) {
    return `Today ${startTime} - ${endTime}`;
  } else if (isTomorrow) {
    return `Tomorrow ${startTime} - ${endTime}`;
  } else {
    const dateStr = start.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    return `${dateStr} ${startTime} - ${endTime}`;
  }
}

/**
 * Get time until event in human-readable format
 *
 * @param start - Event start time
 * @returns Formatted string (e.g., "in 30 minutes", "in 2 hours")
 */
export function getTimeUntilEvent(start: Date): string {
  const now = new Date();
  const diffMs = start.getTime() - now.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 0) {
    return 'started';
  } else if (diffMinutes === 0) {
    return 'starting now';
  } else if (diffMinutes < 60) {
    return `in ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`;
  } else if (diffMinutes < 1440) {
    const hours = Math.floor(diffMinutes / 60);
    return `in ${hours} hour${hours !== 1 ? 's' : ''}`;
  } else {
    const days = Math.floor(diffMinutes / 1440);
    return `in ${days} day${days !== 1 ? 's' : ''}`;
  }
}
