import { CalendarEvent } from '@/lib/calendar/types';

export interface MatchedContact {
  id: string;
  name: string;
  email: string;
  role?: string;
  company?: string;
  photo?: string | null;
  // Add other contact fields you have
}

export interface ContactInput {
  id: string;
  name: string;
  email?: string | null;
  role?: string;
  company?: string;
  photo?: string | null;
  photo_url?: string | null;
}

export interface MatchedMeeting {
  calendarEvent: CalendarEvent;
  matchedContacts: MatchedContact[];
  primaryContact: MatchedContact | null;
  confidence: 'high' | 'medium' | 'low' | 'none';
  matchMethod: 'email' | 'name' | 'none';
}

export interface MatchingResult {
  meetings: MatchedMeeting[];
  stats: {
    total: number;
    matched: number;
    unmatched: number;
    highConfidence: number;
    mediumConfidence: number;
    lowConfidence: number;
  };
}
