import { GoogleCalendarService } from '@/lib/calendar/google-calendar';
import { EmailMatcher } from '@/lib/matching/email-matcher';
import { MeetingDatabase, Meeting } from '@/lib/db/meetings';
import { getContactsForUser } from '@/lib/db/contacts'; // Make sure this exports getContactsForUser
import type { SupabaseClient } from '@supabase/supabase-js';

export class CalendarSyncService {
  /**
   * Sync user's calendar events to database
   */
  static async syncCalendar(supabase: SupabaseClient, userId: string, accessToken: string): Promise<void> {
    try {
      // 1. Fetch calendar events
      const calendarService = new GoogleCalendarService(accessToken);
      const events = await calendarService.getUpcomingEvents(14); // Next 2 weeks

      // 2. Get user's contacts
      const contacts = await getContactsForUser(supabase, userId);

      // 3. Match events to contacts
      // Need to cast events to CalendarEvent? 
      // events are returned as CalendarEvent[] from getUpcomingEvents.
      // contacts are Person[]
      // EmailMatcher expects (CalendarEvent, Contact[])
      // Contact was aliased to Person in email-matcher.ts
      
      const matchedMeetings = EmailMatcher.matchMultipleEvents(events, contacts);

      // 4. Upsert to database
      for (const matched of matchedMeetings.meetings) {
        const event = matched.calendarEvent;
        const contact = matched.matchedContacts[0]; // Primary contact

        await MeetingDatabase.upsertMeeting(supabase, {
          user_id: userId,
          calendar_event_id: event.id,
          calendar_provider: 'google',
          title: event.summary || 'Untitled Meeting',
          description: event.description || '',
          start_time: event.start.dateTime || event.start.date || '',
          end_time: event.end.dateTime || event.end.date || '',
          location: event.location || '',
          meeting_url: event.hangoutLink || '',
          attendees: event.attendees || [],
          contact_id: contact?.id,
          match_confidence: matched.confidence || 'none',
          is_first_meeting: this.isFirstMeeting(contact, event),
          importance: this.calculateImportance(contact, event),
        } as Partial<Meeting>);
      }

      console.log(`Synced ${events.length} calendar events for user ${userId}`);
    } catch (error) {
      console.error('Calendar sync error:', error);
      throw error;
    }
  }

  /**
   * Determine if this is first meeting with contact
   */
  private static isFirstMeeting(contact: any, event: any): boolean {
    if (!contact) return true; // If no contact matched, can't determine, or maybe default false?
    // If we matched a contact, check their last contact data
    // Check if contact has lastContact data
    if (!contact.last_contact_date && !contact.lastContact) return true;
    
    // If last contact was very recent, probably not first meeting
    return false;
  }

  /**
   * Calculate meeting importance
   */
  private static calculateImportance(
    contact: any,
    event: any
  ): 'normal' | 'important' | 'critical' {
    // Check for importance keywords in title
    const title = event.summary?.toLowerCase() || '';
    if (title.includes('investor') || title.includes('board')) return 'critical';
    if (title.includes('important') || title.includes('urgent')) return 'important';

    if (!contact) return 'normal';

    // Check contact tags 
    // Assuming tags is an array of strings directly on contact or via relation
    // For now simplistic check if property exists
    if (contact.tags && Array.isArray(contact.tags)) {
        if (contact.tags.includes('Investor')) return 'critical';
        if (contact.tags.includes('Important')) return 'important';
    }

    return 'normal';
  }
}
