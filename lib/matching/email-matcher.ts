import { CalendarEvent } from '@/lib/calendar/types';
import { MatchedContact, MatchedMeeting, MatchingResult, ContactInput } from './types';

export class EmailMatcher {
  /**
   * Match a single calendar event to contacts
   */
  static matchEventToContacts(
    event: CalendarEvent,
    allContacts: ContactInput[]
  ): MatchedMeeting {
    // If no attendees, return no match
    if (!event.attendees || event.attendees.length === 0) {
      return {
        calendarEvent: event,
        matchedContacts: [],
        primaryContact: null,
        confidence: 'none',
        matchMethod: 'none',
      };
    }

    const matchedContacts: MatchedContact[] = [];
    let totalConfidence = 0;
    let matchMethod: 'email' | 'name' | 'none' = 'none';

    // Try to match each attendee
    for (const attendee of event.attendees) {
      // Skip self if explicitly marked, or try to infer? 
      // API now has self property in type def, assuming calendar service populates it.
      if (attendee.self) continue;

      // Skip if no email
      if (!attendee.email) continue;

      // Try exact email match first (HIGH CONFIDENCE)
      const emailMatch = this.findByEmail(attendee.email, allContacts);
      if (emailMatch) {
        matchedContacts.push(this.contactToMatched(emailMatch));
        totalConfidence += 1.0;
        matchMethod = 'email';
        continue;
      }

      // Try name matching as fallback (MEDIUM CONFIDENCE)
      if (attendee.displayName) {
        const nameMatch = this.findByName(attendee.displayName, allContacts);
        if (nameMatch) {
          matchedContacts.push(this.contactToMatched(nameMatch));
          totalConfidence += 0.6;
          if (matchMethod === 'none') matchMethod = 'name';
        }
      }
    }

    // Calculate overall confidence
    const avgConfidence = event.attendees.length > 1 
      ? totalConfidence / (event.attendees.length - 1) // Subtract self assumption if self is filtered
      : totalConfidence;

    let confidence: 'high' | 'medium' | 'low' | 'none' = 'none';
    if (avgConfidence >= 0.8) confidence = 'high';
    else if (avgConfidence >= 0.4) confidence = 'medium';
    else if (avgConfidence > 0) confidence = 'low';

    // Primary contact is the first matched contact (or null)
    const primaryContact = matchedContacts.length > 0 ? matchedContacts[0] : null;

    return {
      calendarEvent: event,
      matchedContacts,
      primaryContact,
      confidence,
      matchMethod: matchedContacts.length > 0 ? matchMethod : 'none',
    };
  }

  /**
   * Match multiple events to contacts
   */
  static matchMultipleEvents(
    events: CalendarEvent[],
    allContacts: ContactInput[]
  ): MatchingResult {
    const meetings = events.map((event) => 
      this.matchEventToContacts(event, allContacts)
    );

    // Calculate stats
    const matched = meetings.filter((m) => m.matchedContacts.length > 0).length;
    const unmatched = meetings.length - matched;
    const highConfidence = meetings.filter((m) => m.confidence === 'high').length;
    const mediumConfidence = meetings.filter((m) => m.confidence === 'medium').length;
    const lowConfidence = meetings.filter((m) => m.confidence === 'low').length;

    return {
      meetings,
      stats: {
        total: meetings.length,
        matched,
        unmatched,
        highConfidence,
        mediumConfidence,
        lowConfidence,
      },
    };
  }

  /**
   * Filter to only matched meetings
   */
  static filterMatchedOnly(result: MatchingResult): MatchedMeeting[] {
    return result.meetings.filter((m) => m.matchedContacts.length > 0);
  }

  /**
   * Find contact by exact email match
   */
  private static findByEmail(email: string, contacts: ContactInput[]): ContactInput | null {
    const normalizedEmail = email.toLowerCase().trim();
    
    return contacts.find(
      (contact) => 
        contact.email?.toLowerCase().trim() === normalizedEmail
    ) || null;
  }

  /**
   * Find contact by name (fuzzy matching)
   */
  private static findByName(name: string, contacts: ContactInput[]): ContactInput | null {
    const normalizedName = name.toLowerCase().trim();

    // Try exact match
    const exactMatch = contacts.find(
      (contact) => contact.name.toLowerCase().trim() === normalizedName
    );
    if (exactMatch) return exactMatch;

    // Try first name + last name match
    const [firstName, ...lastNameParts] = normalizedName.split(' ');
    const lastName = lastNameParts.join(' ');

    for (const contact of contacts) {
      const contactNameParts = contact.name.toLowerCase().split(' ');
      const contactFirstName = contactNameParts[0];
      const contactLastName = contactNameParts.slice(1).join(' ');

      // Match if both first and last name match
      if (firstName === contactFirstName && lastName && lastName === contactLastName) {
        return contact;
      }

      // Match if full name is contained in contact name
      if (contact.name.toLowerCase().includes(normalizedName)) {
        return contact;
      }
    }

    return null;
  }

  /**
   * Convert contact to MatchedContact format
   */
  private static contactToMatched(contact: ContactInput): MatchedContact {
    return {
      id: contact.id,
      name: contact.name,
      email: contact.email || '',
      role: contact.role,
      company: contact.company,
      photo: contact.photo_url || contact.photo, // Map photo_url or photo
    };
  }
}
