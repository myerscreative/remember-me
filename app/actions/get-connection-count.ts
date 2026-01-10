'use server';

import { createClient } from '@/lib/supabase/server';

export async function getConnectionCount(personId: string) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { success: false, error: 'Not authenticated', count: 0 };
    }

    const { count, error } = await (supabase as any)
      .from('inter_contact_relationships')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .or(`contact_id_a.eq.${personId},contact_id_b.eq.${personId}`);

    if (error) {
      console.error('Error fetching connection count:', error);
      return { success: false, error: error.message, count: 0 };
    }

    return { 
      success: true, 
      count: count || 0
    };
  } catch (error: any) {
    console.error('Unexpected error in getConnectionCount:', error);
    return { success: false, error: error.message, count: 0 };
  }
}
