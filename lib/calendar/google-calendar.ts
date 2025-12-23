import { google } from 'googleapis';
import { CalendarEvent, CalendarListResponse } from './types';

export class GoogleCalendarService {
  private calendar;

  constructor(accessToken: string) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    this.calendar = google.calendar({ version: 'v3', auth });
  }

  /**
   * Fetch upcoming events from user's primary calendar
   */
  async getUpcomingEvents(days: number = 7): Promise<CalendarEvent[]> {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days);

    try {
      const response = await this.calendar.events.list({
        calendarId: 'primary',
        timeMin: now.toISOString(),
        timeMax: futureDate.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 20,
      });

      return (response.data.items as unknown as CalendarEvent[]) || [];
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Google Calendar API Error: ${errorMessage}`);
    }
  }

  /**
   * Get events for today
   */
  async getTodayEvents(): Promise<CalendarEvent[]> {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    return this.getEventsInRange(start, end);
  }

  /**
   * Get events for this week
   */
  async getThisWeekEvents(): Promise<CalendarEvent[]> {
    const start = new Date(); // Now
    const end = new Date();
    end.setDate(start.getDate() + 7); // Next 7 days

    return this.getEventsInRange(start, end);
  }

  /**
   * Get events for a specific date range
   */
  async getEventsInRange(startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    try {
      const response = await this.calendar.events.list({
        calendarId: 'primary',
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });

      return (response.data.items as unknown as CalendarEvent[]) || [];
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Google Calendar API Error: ${errorMessage}`);
    }
  }
}
