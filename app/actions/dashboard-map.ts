"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Get all contacts for Map Visualization (Server-Side Force Sync)
 */
export async function getAllMapContacts(): Promise<{ data: any[]; totalCount: number; activeCount: number; error: string | null }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { data: [], totalCount: 0, activeCount: 0, error: "User not authenticated" };
    }

    const { data: contacts, error, count: totalCount } = await (supabase as any)
      .from('persons')
      .select('id, name, last_interaction_date, importance, target_frequency_days, is_favorite, person_tags(tags(name))', { count: 'exact' })
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching map contacts:', error);
      return { data: [], totalCount: 0, activeCount: 0, error: error.message };
    }
    
    // Server-side Intensity Mapping to guarantee 'Active' status
    const mappedContacts = (contacts || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        last_interaction_date: c.last_interaction_date,
        lastContact: c.last_interaction_date,
        target_frequency_days: c.target_frequency_days,
        is_favorite: c.is_favorite,
        // FORCE SYNC LOGIC: If date exists, it IS active.
        importance: c.importance || (c.last_interaction_date ? 'medium' : null), 
        intensity: c.importance || (c.last_interaction_date ? 'medium' : null), 
        tags: c.person_tags?.map((pt: any) => pt.tags?.name).filter(Boolean) || []
    }));

    const activeCount = mappedContacts.filter((c: any) => c.intensity).length;

    return { data: mappedContacts, totalCount: totalCount || 0, activeCount, error: null };
  } catch (error: any) {
    console.error('Critical Error in getAllMapContacts:', error);
    return { data: [], totalCount: 0, activeCount: 0, error: error.message || 'Unknown server error' };
  }
}
