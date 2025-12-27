'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function logContactInteraction(
  personId: string, 
  type: 'call' | 'email' | 'message' | 'meeting' | 'other',
  notes?: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // 1. Insert Interaction Record
    const { error: maxInteractionError } = await supabase
      .from('interactions')
      .insert({
        person_id: personId,
        user_id: user.id,
        interaction_type: type,
        interaction_date: new Date().toISOString(),
        notes: notes || null
      });

    if (maxInteractionError) throw maxInteractionError;

    // 2. Update Person Status
    // We increment interaction_count and set last_interaction_date
    // We could also set a 'status' field if it existed (e.g. 'Blooming'), 
    // but the schema uses `relationship_value` or similar. 
    // For now, we update the core timestamp fields.
    const { error: updateError } = await supabase
      .from('persons')
      .update({
        last_interaction_date: new Date().toISOString(),
        last_contact_method: type,
        // Optional: Increment interaction_count if we want to track volume
        updated_at: new Date().toISOString()
      })
      .eq('id', personId)
      .eq('user_id', user.id);

    if (updateError) throw updateError;

    revalidatePath('/dashboard');
    revalidatePath(`/contacts/${personId}`);

    return { success: true };
  } catch (error: any) {
    console.error("Error logging interaction:", error);
    return { success: false, error: error.message };
  }
}
