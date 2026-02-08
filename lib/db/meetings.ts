import type { SupabaseClient } from '@supabase/supabase-js';

export interface Meeting {
  id: string;
  user_id: string;
  calendar_event_id: string;
  calendar_provider: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  meeting_url?: string;
  attendees: any[];
  contact_id?: string;
  match_confidence?: 'high' | 'medium' | 'low' | 'none';
  is_first_meeting: boolean;
  importance: 'normal' | 'important' | 'critical';
  meeting_type?: string;
  conversation_starters: string[];
  mutual_connections: any[];
  prep_notes?: string;
  prep_status: 'not_started' | 'in_progress' | 'ready';
  created_at: string;
  updated_at: string;
}

export class MeetingDatabase {
  /**
   * Create or update meeting from calendar event
   */
  static async upsertMeeting(supabase: SupabaseClient, meeting: Partial<Meeting>): Promise<Meeting | null> {
    const { data, error } = await supabase
      .from('meetings')
      .upsert(
        {
          ...meeting,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,calendar_event_id',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Error upserting meeting:', error);
      return null;
    }

    return data;
  }

  /**
   * Get upcoming meetings for user
   */
  static async getUpcomingMeetings(supabase: SupabaseClient, userId: string, days: number = 7): Promise<Meeting[]> {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days);

    const { data, error } = await supabase
      .from('meetings')
      .select(`
        *,
        contact:persons(*)
      `)
      .eq('user_id', userId)
      .gte('start_time', now.toISOString())
      .lte('start_time', futureDate.toISOString())
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching meetings:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get meeting by ID with contact data
   */
  static async getMeetingById(supabase: SupabaseClient, meetingId: string): Promise<Meeting | null> {
    const { data, error } = await supabase
      .from('meetings')
      .select(`
        *,
        contact:persons(*)
      `)
      .eq('id', meetingId)
      .single();

    if (error) {
      console.error('Error fetching meeting:', error);
      return null;
    }

    return data;
  }

  /**
   * Update prep notes
   */
  static async updatePrepNotes(supabase: SupabaseClient, meetingId: string, notes: string): Promise<boolean> {
    const { error } = await supabase
      .from('meetings')
      .update({ prep_notes: notes, updated_at: new Date().toISOString() })
      .eq('id', meetingId);

    return !error;
  }

  /**
   * Update prep status
   */
  static async updatePrepStatus(
    supabase: SupabaseClient,
    meetingId: string,
    status: 'not_started' | 'in_progress' | 'ready'
  ): Promise<boolean> {
    const { error } = await supabase
      .from('meetings')
      .update({ prep_status: status, updated_at: new Date().toISOString() })
      .eq('id', meetingId);

    return !error;
  }

  /**
   * Delete old meetings (cleanup)
   */
  static async deleteOldMeetings(supabase: SupabaseClient, userId: string, daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { count, error } = await supabase
      .from('meetings')
      .delete({ count: 'exact' })
      .eq('user_id', userId)
      .lt('end_time', cutoffDate.toISOString());

    if (error) {
      console.error('Error deleting old meetings:', error);
      return 0;
    }

    return count || 0;
  }
}

