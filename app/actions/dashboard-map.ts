"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Get all contacts for Map Visualization (Server-Side Force Sync)
 */
export async function getAllMapContacts(): Promise<{ data: any[]; totalCount: number; activeCount: number; error: Error | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  console.log("Server Sync User:", user?.id);

  if (!user) {
    console.log("Server Sync: No User");
    return { data: [], totalCount: 0, activeCount: 0, error: new Error("User not authenticated") };
  }

  try {
    const { data: contacts, error, count: totalCount } = await (supabase as any)
      .from('persons')
      .select('id, name, last_interaction_date, importance, relationship_value, person_tags(tags(name))', { count: 'exact' })
      .eq('user_id', user.id);

    console.log("Server Sync Raw Count:", totalCount);
    console.log("Server Sync Raw Data Length:", contacts?.length);

    if (error) {
      console.error('Error fetching map contacts:', error);
      return { data: [], totalCount: 0, activeCount: 0, error: new Error(error.message) };
    }
    
    // Server-side Intensity Mapping to guarantee 'Active' status
    const mappedContacts = (contacts || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        lastContact: c.last_interaction_date,
        // FORCE SYNC LOGIC: If date exists, it IS active.
        intensity: c.relationship_value || c.importance || (c.last_interaction_date ? 'medium' : null), 
        tags: c.person_tags?.map((pt: any) => pt.tags?.name).filter(Boolean) || []
    }));

    const activeCount = mappedContacts.filter((c: any) => c.intensity).length;
    console.log("Server Sync Active Count:", activeCount);

    return { data: mappedContacts, totalCount: totalCount || 0, activeCount, error: null };
  } catch (error) {
    console.error('Error fetching map contacts:', error);
    return { data: [], totalCount: 0, activeCount: 0, error: error instanceof Error ? error : new Error('Unknown error') };
  }
}
