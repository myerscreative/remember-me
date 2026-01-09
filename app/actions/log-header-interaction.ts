'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function logHeaderInteraction(
  personId: string, 
  type: 'connection' | 'attempt',
  note?: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // 1. Insert Interaction Record
    // For 'connection', we can default to 'other' or a specific type if desired.
    // For 'attempt', we log it but note it was an attempt.
    const interactionType = 'other'; 
    const finalNote = note ? note : (type === 'attempt' ? 'Contact Attempt' : 'Quick Update');

    const { error: insertError } = await (supabase as any)
      .from('interactions')
      .insert({
        person_id: personId,
        user_id: user.id,
        interaction_type: interactionType,
        interaction_date: new Date().toISOString(),
        notes: finalNote
      });

    if (insertError) throw insertError;

    // 2. Conditional Update of Person Status
    // ONLY update last_interaction_date if it is a 'connection'
    if (type === 'connection') {
      const { error: updateError } = await (supabase as any)
        .from('persons')
        .update({
          last_interaction_date: new Date().toISOString(),
          // We preserve the last_contact_method if we don't have a specific one, 
          // or we could set it to 'other'. Let's leave it as is or update if needed.
          // The user requirement is just "update the last_interaction_date to NOW".
          updated_at: new Date().toISOString()
        })
        .eq('id', personId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;
    }

    revalidatePath('/dashboard');
    revalidatePath(`/contacts/${personId}`);

    return { success: true };
  } catch (error: any) {
    console.error("Error logging header interaction:", error);
    return { success: false, error: error.message };
  }
}
