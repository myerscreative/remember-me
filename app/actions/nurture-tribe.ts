'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function nurtureTribe(contactIds: string[], interactionType: string, notes: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    // 1. Bulk update persons table
    const { error: updateError } = await (supabase as any)
      .from('persons')
      .update({ 
        last_interaction_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .in('id', contactIds)
      .eq('user_id', user.id);

    if (updateError) throw updateError;

    // 2. Insert records into interactions table for each contact
    const interactions = contactIds.map(id => ({
      user_id: user.id,
      person_id: id,
      interaction_type: (interactionType as any) || 'other',
      notes: notes,
      interaction_date: new Date().toISOString()
    }));

    const { error: insertError } = await (supabase as any)
      .from('interactions')
      .insert(interactions);

    if (insertError) throw insertError;

    // 3. Revalidate paths
    revalidatePath('/dashboard');
    revalidatePath('/network');
    revalidatePath('/garden');

    return { success: true, xpAwarded: 50 };
  } catch (error: any) {
    console.error("Error nurturing tribe:", error);
    return { success: false, error: error.message };
  }
}
