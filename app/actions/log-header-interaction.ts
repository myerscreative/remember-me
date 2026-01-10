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
    // 1. Structured Interaction Log (Direct Insert)
    const interactionType = type === 'connection' ? 'call' : 'other';
    const finalNote = note ? note : (type === 'attempt' ? 'Contact Attempt' : 'Quick Update');
    
    console.log('Attempting to insert interaction (Direct):', {
      person_id: personId,
      user_id: user.id,
      type: interactionType,
      notes: finalNote
    });

    // Direct insert to bypass any RPC issues
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: insertError } = await (supabase as any)
      .from('interactions')
      .insert({
        person_id: personId,
        user_id: user.id,
        type: interactionType,
        date: new Date().toISOString(),
        notes: finalNote
      });

    if (insertError) {
        console.error("Error logging interaction record:", insertError);
        throw new Error(`Failed to insert interaction: ${insertError.message}`);
    }

    console.log('Interaction inserted successfully');

    // 2. Shared Memory Log (User Narrative)
    if (note || type === 'attempt') {
        const memoryContent = type === 'attempt' && !note
          ? `[Attempted Contact] No note left.` 
          : (type === 'attempt' ? `[Attempted Contact] ${note}` : note);

        if (memoryContent) {
             const { error: memoryError } = await supabase
              .from("shared_memories")
              .insert({
                person_id: personId,
                user_id: user.id,
                content: memoryContent
              });
            
             if (memoryError) console.error("Memory Log Error:", memoryError);
        }
    }

    // 3. Update Person Status (Only for connections)
    if (type === 'connection') {
      const { error: updateError } = await supabase
        .from('persons')
        .update({
          last_interaction_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', personId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;
    }

    revalidatePath('/dashboard');
    revalidatePath(`/contacts/${personId}`);
    revalidatePath('/garden');

    return { success: true };
  } catch (error: any) {
    console.error("Error logging header interaction:", error);
    return { success: false, error: error.message };
  }
}
