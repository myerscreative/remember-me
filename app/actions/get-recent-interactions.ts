'use server';

import { createClient } from "@/lib/supabase/server";

export async function getRecentInteractions(personId: string, limit: number = 5) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized", interactions: [] };
  }

  try {
    const { data, error } = await (supabase as any)
      .from('interactions')
      .select('*')
      .eq('person_id', personId)
      .eq('user_id', user.id)
      .order('interaction_date', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return { success: true, interactions: data || [] };
  } catch (error: any) {
    console.error("Error fetching interactions:", error);
    return { success: false, error: error.message, interactions: [] };
  }
}
