'use server';

import { createClient } from '@/lib/supabase/server';
import { type InteractionType } from '@/lib/relationship-health';

export interface InteractionHistoryItem {
  id: string;
  created_at: string;
  type: InteractionType;
  notes: string | null;
  next_goal_note?: string | null;
}

export async function getRecentInteractions(personId: string, limit: number = 5) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const { data: interactions, error } = await supabase
      .from('interactions')
      .select('id, created_at, type, notes, next_goal_note')
      .eq('person_id', personId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return { success: true, data: interactions as InteractionHistoryItem[] };
  } catch (error: any) {
    console.error('Error fetching interactions:', error);
    return { success: false, error: error.message };
  }
}
