// Meeting Matcher - Match calendar attendees to contacts in database

import { createClient } from "@/lib/supabase/client";
import type { Person } from "@/types/database.types";
import type { CalendarEvent, Attendee, MeetingPrep } from "@/types/calendar";

/**
 * Match calendar event attendees to persons in the database
 *
 * @param event - Calendar event with attendees
 * @returns MeetingPrep object with matched persons and unmatched attendees
 *
 * @example
 * const prep = await matchAttendeesToPersons(calendarEvent);
 * console.log(`Found ${prep.persons.length} known contacts`);
 */
export async function matchAttendeesToPersons(
  event: CalendarEvent
): Promise<MeetingPrep> {
  const supabase = createClient();

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      event,
      persons: [],
      unmatchedAttendees: event.attendees,
      prepReady: false,
      minutesUntilMeeting: calculateMinutesUntil(event.start),
      isUpcoming: false,
    };
  }

  // Extract attendee emails (excluding the user's own email)
  const attendeeEmails = event.attendees
    .map(a => a.email.toLowerCase().trim())
    .filter(email => email !== user.email?.toLowerCase());

  if (attendeeEmails.length === 0) {
    return {
      event,
      persons: [],
      unmatchedAttendees: [],
      prepReady: true,
      minutesUntilMeeting: calculateMinutesUntil(event.start),
      isUpcoming: isUpcomingMeeting(event.start),
      prepSummary: "No other attendees in this meeting.",
    };
  }

  try {
    // Query database for matching persons
    const { data: matchedPersons, error } = await supabase
      .from('persons')
      .select('*')
      .eq('user_id', user.id)
      .in('email', attendeeEmails)
      .or('archive_status.is.null,archive_status.eq.false');

    if (error) {
      console.error('Error querying persons:', error);
      return {
        event,
        persons: [],
        unmatchedAttendees: event.attendees,
        prepReady: false,
        minutesUntilMeeting: calculateMinutesUntil(event.start),
        isUpcoming: isUpcomingMeeting(event.start),
      };
    }

    const persons = matchedPersons || [];

    // Identify unmatched attendees
    const matchedEmails = new Set(
      persons.map(p => p.email?.toLowerCase()).filter(Boolean)
    );

    const unmatchedAttendees = event.attendees.filter(
      a => !matchedEmails.has(a.email.toLowerCase()) && a.email.toLowerCase() !== user.email?.toLowerCase()
    );

    // Generate prep summary
    const prepSummary = generatePrepSummary(persons, unmatchedAttendees);

    return {
      event,
      persons,
      unmatchedAttendees,
      prepReady: true,
      minutesUntilMeeting: calculateMinutesUntil(event.start),
      isUpcoming: isUpcomingMeeting(event.start),
      prepSummary,
    };
  } catch (error) {
    console.error('Error matching attendees:', error);
    return {
      event,
      persons: [],
      unmatchedAttendees: event.attendees,
      prepReady: false,
      minutesUntilMeeting: calculateMinutesUntil(event.start),
      isUpcoming: isUpcomingMeeting(event.start),
    };
  }
}

/**
 * Match multiple calendar events to persons
 *
 * @param events - Array of calendar events
 * @returns Array of MeetingPrep objects
 */
export async function matchMultipleEvents(
  events: CalendarEvent[]
): Promise<MeetingPrep[]> {
  const preps = await Promise.all(
    events.map(event => matchAttendeesToPersons(event))
  );

  return preps;
}

/**
 * Get upcoming meetings with known contacts (next 7 days)
 *
 * @param events - Array of calendar events
 * @param onlyKnownContacts - If true, only return meetings with known contacts
 * @returns Array of MeetingPrep objects filtered by criteria
 */
export async function getUpcomingMeetingsWithContacts(
  events: CalendarEvent[],
  onlyKnownContacts: boolean = false
): Promise<MeetingPrep[]> {
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Filter to upcoming events only
  const upcomingEvents = events.filter(
    event => event.start >= now && event.start <= sevenDaysFromNow
  );

  // Match attendees to persons
  const preps = await matchMultipleEvents(upcomingEvents);

  // Optionally filter to only meetings with known contacts
  if (onlyKnownContacts) {
    return preps.filter(prep => prep.persons.length > 0);
  }

  return preps;
}

/**
 * Get meetings requiring notification (within notification window)
 *
 * @param events - Array of calendar events
 * @param notificationMinutes - Minutes before meeting to notify (default: 30)
 * @returns Array of MeetingPrep objects that need notification
 */
export async function getMeetingsRequiringNotification(
  events: CalendarEvent[],
  notificationMinutes: number = 30
): Promise<MeetingPrep[]> {
  const preps = await matchMultipleEvents(events);

  return preps.filter(prep => {
    const minutesUntil = prep.minutesUntilMeeting;
    // Notify if meeting is within notification window and hasn't started yet
    return minutesUntil > 0 && minutesUntil <= notificationMinutes;
  });
}

/**
 * Find person by attendee email
 *
 * @param attendeeEmail - Email address of attendee
 * @returns Person object if found, null otherwise
 */
export async function findPersonByEmail(
  attendeeEmail: string
): Promise<Person | null> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('persons')
    .select('*')
    .eq('user_id', user.id)
    .ilike('email', attendeeEmail.trim())
    .or('archive_status.is.null,archive_status.eq.false')
    .single();

  if (error || !data) return null;

  return data;
}

/**
 * Calculate minutes until a given date
 *
 * @param date - Target date
 * @returns Minutes until date (negative if in the past)
 */
export function calculateMinutesUntil(date: Date): number {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  return Math.floor(diffMs / (1000 * 60));
}

/**
 * Check if a meeting is upcoming (within next 2 hours)
 *
 * @param startTime - Meeting start time
 * @returns True if meeting is within next 2 hours
 */
export function isUpcomingMeeting(startTime: Date): boolean {
  const minutesUntil = calculateMinutesUntil(startTime);
  return minutesUntil > 0 && minutesUntil <= 120;
}

/**
 * Generate a prep summary for a meeting
 *
 * @param persons - Matched persons
 * @param unmatchedAttendees - Unmatched attendees
 * @returns Summary string
 */
function generatePrepSummary(
  persons: Person[],
  unmatchedAttendees: Attendee[]
): string {
  const parts: string[] = [];

  if (persons.length > 0) {
    const names = persons.map(p => p.first_name || p.name).filter(Boolean);
    if (names.length === 1) {
      parts.push(`Meeting with ${names[0]}`);
    } else if (names.length === 2) {
      parts.push(`Meeting with ${names[0]} and ${names[1]}`);
    } else if (names.length > 2) {
      parts.push(`Meeting with ${names[0]}, ${names[1]}, and ${names.length - 2} others`);
    }

    // Add context hints
    const withContext = persons.filter(p => p.has_context);
    if (withContext.length > 0) {
      parts.push(`${withContext.length} contact${withContext.length > 1 ? 's' : ''} with relationship data`);
    }
  }

  if (unmatchedAttendees.length > 0) {
    parts.push(`${unmatchedAttendees.length} unknown attendee${unmatchedAttendees.length > 1 ? 's' : ''}`);
  }

  if (parts.length === 0) {
    return "Meeting details available";
  }

  return parts.join(' • ');
}

/**
 * Get relationship context summary for a person (for meeting prep)
 *
 * @param person - Person object
 * @returns Formatted context string
 */
export function getPersonContextSummary(person: Person): string {
  const parts: string[] = [];

  if (person.relationship_summary) {
    parts.push(person.relationship_summary);
  }

  if (person.where_met) {
    parts.push(`Met: ${person.where_met}`);
  }

  if (person.who_introduced) {
    parts.push(`Introduced by: ${person.who_introduced}`);
  }

  if (person.last_interaction_date) {
    const daysSince = Math.floor(
      (Date.now() - new Date(person.last_interaction_date).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSince === 0) {
      parts.push('Last contact: Today');
    } else if (daysSince === 1) {
      parts.push('Last contact: Yesterday');
    } else if (daysSince < 7) {
      parts.push(`Last contact: ${daysSince} days ago`);
    } else if (daysSince < 30) {
      parts.push(`Last contact: ${Math.floor(daysSince / 7)} weeks ago`);
    } else {
      parts.push(`Last contact: ${Math.floor(daysSince / 30)} months ago`);
    }
  }

  if (parts.length === 0) {
    return "No context available";
  }

  return parts.join(' • ');
}

/**
 * Sort meeting preps by start time
 *
 * @param preps - Array of MeetingPrep objects
 * @returns Sorted array (earliest first)
 */
export function sortMeetingPrepsByTime(preps: MeetingPrep[]): MeetingPrep[] {
  return [...preps].sort((a, b) => a.event.start.getTime() - b.event.start.getTime());
}

/**
 * Filter meeting preps by date range
 *
 * @param preps - Array of MeetingPrep objects
 * @param startDate - Start of range
 * @param endDate - End of range
 * @returns Filtered array
 */
export function filterMeetingPrepsByDateRange(
  preps: MeetingPrep[],
  startDate: Date,
  endDate: Date
): MeetingPrep[] {
  return preps.filter(
    prep => prep.event.start >= startDate && prep.event.start <= endDate
  );
}

/**
 * Get today's meetings
 *
 * @param preps - Array of MeetingPrep objects
 * @returns Today's meetings
 */
export function getTodaysMeetings(preps: MeetingPrep[]): MeetingPrep[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return filterMeetingPrepsByDateRange(preps, today, tomorrow);
}
