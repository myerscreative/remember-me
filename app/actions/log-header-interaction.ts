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
    // 1. Structured Interaction Log (System Record)
    // We keep this for analytics/interaction counts
    const interactionType = type === 'connection' ? 'call' : 'other';
    const finalNote = note ? note : (type === 'attempt' ? 'Contact Attempt' : 'Quick Update');
    
    console.log('Attempting to insert interaction:', {
      person_id: personId,
      user_id: user.id,
      interaction_type: interactionType,
      notes: finalNote
    });

    const { data: interactionId, error: insertError } = await supabase
      .rpc('insert_interaction', {
        p_person_id: personId,
        p_user_id: user.id,
        p_interaction_type: interactionType,
        p_interaction_date: new Date().toISOString(),
        p_notes: finalNote
      });

    if (insertError) {
        console.error("Error logging interaction record:", insertError);
        throw new Error(`Failed to insert interaction: ${insertError.message}`);
    }

    console.log('Interaction inserted successfully');

    // 2. Shared Memory Log (User Narrative)
    // As per request: "If a note exists or it's a specific type, log to 'shared_memories'"
    if (note || type === 'attempt') {
        const memoryContent = type === 'attempt' && !note
          ? `[Attempted Contact] No note left.` 
          : (type === 'attempt' ? `[Attempted Contact] ${note}` : note);

        if (memoryContent) { // Type guard
             const { error: memoryError } = await (supabase as any)
              .from("shared_memories")
              .insert({
                person_id: personId,
                user_id: user.id, // Explicitly adding user_id if needed, schema usually requires it
                content: memoryContent,
                // category: type === 'connection' ? 'moment' : 'milestone', // Schema check: 'category' field doesn't exist in my reading of database.types.ts earlier? 
                // Wait, database.types.ts showed shared_memories columns: id, user_id, person_id, content, created_at, updated_at.
                // It DID NOT show 'category' or 'occurred_at'. 
                // User snippet used 'category' and 'occurred_at'. 
                // I will OMIT those fields to prevent errors, unless I see them in the schema.
                // I'll stick to content.
              });
            
             if (memoryError) console.error("Memory Log Error:", memoryError);
        }
    }

    // 3. Update Person Status
    if (type === 'connection') {
      const { error: updateError } = await (supabase as any)
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
