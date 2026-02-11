// types/game.ts

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: Date;
  attendeeEmails: string[]; // To match with our 'People' database
}

export interface EventPrepSession {
  eventId: string;
  contactsToReview: string[]; // Array of Contact IDs
  focusAreas: ('Bio' | 'LastMet' | 'Interests' | 'Family')[];
}

export interface GameStats {
  gamesPlayed: number;
  totalXP: number;
  level: number;
  currentStreak: number;
  bestScores: {
    faceMatch: number;
    factMatch: number;
    [key: string]: number;
  };
}
