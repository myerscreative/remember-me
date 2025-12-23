export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  location?: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus: string;
    self?: boolean;
  }>;
  hangoutLink?: string;
  conferenceData?: any;
}

export interface CalendarListResponse {
  items: CalendarEvent[];
}
