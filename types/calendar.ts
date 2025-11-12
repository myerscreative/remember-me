// Calendar Integration Types for ReMember Me
// Supports Google Calendar, Microsoft Outlook, and Apple Calendar

import type { Person } from "./database.types";

/**
 * Calendar provider types
 */
export type CalendarProvider = 'google' | 'microsoft' | 'apple' | 'unknown';

/**
 * Calendar event attendee
 */
export interface Attendee {
  /** Attendee email address (used for matching to persons) */
  email: string;
  /** Attendee display name */
  name?: string;
  /** Response status: accepted, tentative, declined, needsAction */
  responseStatus?: 'accepted' | 'tentative' | 'declined' | 'needsAction';
  /** Whether this attendee is the organizer */
  organizer?: boolean;
  /** Whether this is an optional attendee */
  optional?: boolean;
}

/**
 * Calendar event from any provider
 */
export interface CalendarEvent {
  /** Unique event ID */
  id: string;
  /** Event title/summary */
  title: string;
  /** Event description/notes */
  description?: string;
  /** Start date/time */
  start: Date;
  /** End date/time */
  end: Date;
  /** Event location (physical or virtual) */
  location?: string;
  /** Meeting link (Zoom, Google Meet, etc.) */
  meetingLink?: string;
  /** List of attendees */
  attendees: Attendee[];
  /** Calendar provider this event came from */
  provider: CalendarProvider;
  /** Whether this is an all-day event */
  allDay: boolean;
  /** Event organizer email */
  organizerEmail?: string;
  /** Event status: confirmed, tentative, cancelled */
  status?: 'confirmed' | 'tentative' | 'cancelled';
  /** Raw event data from provider (for debugging) */
  rawData?: any;
}

/**
 * Meeting prep data combining calendar event with contact information
 */
export interface MeetingPrep {
  /** The calendar event */
  event: CalendarEvent;
  /** Matched persons from the database */
  persons: Person[];
  /** Unmatched attendees (no contact record found) */
  unmatchedAttendees: Attendee[];
  /** Whether prep data is ready to display */
  prepReady: boolean;
  /** Time until meeting in minutes */
  minutesUntilMeeting: number;
  /** Whether this is an upcoming meeting (within notification window) */
  isUpcoming: boolean;
  /** Prep summary text */
  prepSummary?: string;
}

/**
 * Calendar sync status
 */
export interface CalendarSyncStatus {
  /** Whether calendar sync is enabled */
  enabled: boolean;
  /** Whether we have calendar permissions */
  hasPermission: boolean;
  /** Calendar provider being used */
  provider?: CalendarProvider;
  /** Last sync timestamp */
  lastSync?: Date;
  /** Error message if sync failed */
  error?: string;
  /** Number of upcoming events */
  upcomingEventsCount?: number;
}

/**
 * Calendar permission request result
 */
export interface CalendarPermissionResult {
  /** Whether permission was granted */
  granted: boolean;
  /** Calendar provider */
  provider: CalendarProvider;
  /** Error message if permission denied */
  error?: string;
  /** User-facing error message */
  userMessage?: string;
}

/**
 * Calendar sync preferences (stored in database)
 */
export interface CalendarSyncPreferences {
  /** User ID */
  userId: string;
  /** Whether calendar sync is enabled */
  calendarEnabled: boolean;
  /** Minutes before meeting to show notification */
  notificationTime: number;
  /** Calendar provider */
  provider?: CalendarProvider;
  /** Whether to show prep for all meetings or only with known contacts */
  onlyKnownContacts: boolean;
  /** Access token (encrypted) */
  accessToken?: string;
  /** Refresh token (encrypted) */
  refreshToken?: string;
  /** Token expiry */
  tokenExpiry?: Date;
  /** Created at timestamp */
  createdAt: Date;
  /** Updated at timestamp */
  updatedAt: Date;
}

/**
 * Google Calendar specific types
 */
export namespace GoogleCalendar {
  export interface Event {
    id: string;
    summary: string;
    description?: string;
    start: {
      dateTime?: string;
      date?: string;
      timeZone?: string;
    };
    end: {
      dateTime?: string;
      date?: string;
      timeZone?: string;
    };
    location?: string;
    hangoutLink?: string;
    attendees?: Array<{
      email: string;
      displayName?: string;
      responseStatus?: string;
      organizer?: boolean;
      optional?: boolean;
    }>;
    organizer?: {
      email: string;
      displayName?: string;
    };
    status?: string;
  }

  export interface ListResponse {
    items: Event[];
    nextPageToken?: string;
  }
}

/**
 * Microsoft Outlook/Graph specific types
 */
export namespace MicrosoftCalendar {
  export interface Event {
    id: string;
    subject: string;
    bodyPreview?: string;
    start: {
      dateTime: string;
      timeZone: string;
    };
    end: {
      dateTime: string;
      timeZone: string;
    };
    location?: {
      displayName?: string;
    };
    onlineMeetingUrl?: string;
    attendees?: Array<{
      emailAddress: {
        address: string;
        name?: string;
      };
      status?: {
        response?: string;
      };
      type?: string;
    }>;
    organizer?: {
      emailAddress: {
        address: string;
        name?: string;
      };
    };
    isAllDay?: boolean;
    isCancelled?: boolean;
  }

  export interface ListResponse {
    value: Event[];
    '@odata.nextLink'?: string;
  }
}

/**
 * Calendar integration error types
 */
export class CalendarError extends Error {
  constructor(
    message: string,
    public code: CalendarErrorCode,
    public provider?: CalendarProvider,
    public originalError?: any
  ) {
    super(message);
    this.name = 'CalendarError';
  }
}

export type CalendarErrorCode =
  | 'PERMISSION_DENIED'
  | 'NOT_SUPPORTED'
  | 'API_ERROR'
  | 'NETWORK_ERROR'
  | 'AUTH_EXPIRED'
  | 'INVALID_TOKEN'
  | 'RATE_LIMIT'
  | 'NO_EVENTS'
  | 'UNKNOWN';

/**
 * Meeting prep notification
 */
export interface MeetingNotification {
  /** Meeting prep data */
  meetingPrep: MeetingPrep;
  /** Notification title */
  title: string;
  /** Notification body */
  body: string;
  /** Whether notification has been shown */
  shown: boolean;
  /** Timestamp when notification should be shown */
  showAt: Date;
}
