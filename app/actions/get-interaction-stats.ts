'use server';

import { createClient } from '@/lib/supabase/server';

export async function getInteractionStats(personId: string) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { success: false, error: 'Not authenticated', count: 0 };
    }

    const { data, error, count } = await (supabase as any)
      .from('interactions')
      .select('*', { count: 'exact', head: false })
      .eq('person_id', personId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching interaction stats:', error);
      return { success: false, error: error.message, count: 0 };
    }

    return { 
      success: true, 
      count: count || 0,
      interactions: data || []
    };
  } catch (error: any) {
    console.error('Unexpected error in getInteractionStats:', error);
    return { success: false, error: error.message, count: 0 };
  }
}
