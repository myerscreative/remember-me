import type { SupabaseClient } from '@supabase/supabase-js';
import type { Person } from '@/types/database.types';

export async function getContactsForUser(supabase: SupabaseClient, userId: string): Promise<Person[]> {
  const { data, error } = await supabase
    .from('persons')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching contacts:', error);
    return [];
  }

  return data || [];
}
