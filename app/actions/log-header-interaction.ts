'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function logHeaderInteraction(
  personId: string, 
  type: 'connection' | 'attempt',
  note?: string
) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error("Auth Error in logHeaderInteraction:", authError);
    return { success: false, error: "Unauthorized - No active session" };
  }

  try {
    // 1. Structured Interaction Log
    const interactionType = type === 'connection' ? 'call' : 'other';
    const finalNote = note ? note : (type === 'attempt' ? 'Contact Attempt' : 'Quick Update');
    
    // Direct insert
    const { data: insertData, error: insertError } = await (supabase as any)
      .from('interactions')
      .insert({
        person_id: personId,
        user_id: user.id,
        type: interactionType,
        date: new Date().toISOString(),
        notes: finalNote
      })
      .select();

    if (insertError) {
        // Check for specific column error to give better feedback if schema is still wrong
        if (insertError.message.includes('column "date" does not exist')) {
             console.error("Schema Mismatch: 'date' column missing. Trying 'interaction_date'...");
             // Fallback attempt
             const { error: fallbackError } = await (supabase as any)
              .from('interactions')
              .insert({
                person_id: personId,
                user_id: user.id,
                type: interactionType,
                interaction_date: new Date().toISOString(),
                notes: finalNote
              })
              .select();
              
              if (fallbackError) {
                console.error("Fallback Log Error:", fallbackError);
                throw new Error(`Failed to insert interaction (Fallback): ${fallbackError.message}`);
              }
        } else {
             console.error("Error logging interaction record:", insertError);
             throw new Error(`Failed to insert interaction: ${insertError.message}`);
        }
    }

    // 2. Shared Memory Log (User Narrative)
    if (note || type === 'attempt') {
        const memoryContent = type === 'attempt' && !note
          ? `[Attempted Contact] No note left.` 
          : (type === 'attempt' ? `[Attempted Contact] ${note}` : note);

        if (memoryContent) {
             const { error: memoryError } = await (supabase as any)
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
      const { error: updateError } = await (supabase as any)
        .from('persons')
        .update({
          last_interaction_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', personId)
        .eq('user_id', user.id);

      if (updateError) {
          console.error("Error updating person status:", updateError);
          throw updateError;
      }
    }

    revalidatePath('/dashboard');
    revalidatePath(`/contacts/${personId}`);
    revalidatePath('/garden');

    return { success: true };
  } catch (error: any) {
    console.error("Error logging header interaction:", error);
    return { 
        success: false, 
        error: error.message || "Unknown error occurred",
        details: error 
    };
  }
}
