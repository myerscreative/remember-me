'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function logHeaderInteraction(
  personId: string, 
  interactionType: 'connection' | 'attempt',
  note?: string
) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('[logHeaderInteraction] Auth Failed:', authError);
    // Original code returned an object, new code throws an error.
    // Adjusting to throw an error as per the provided change.
    throw new Error('Not authenticated');
  }
  console.log(`[logHeaderInteraction] User Authenticated: ${user.id}`);

  try {
    // 1. Structured Interaction Log
    // The 'interactionType' parameter is now used directly.
    // The 'finalNote' calculation is simplified as per the provided change.
    const finalNote = note?.trim() || '';
    
    // Map internal types to DB allowed enum types:
    // ('call', 'email', 'text', 'meeting', 'other', 'in-person', 'social')
    const dbType = interactionType === 'connection' ? 'other' : 'other';
    
    // For attempts, we might want to flag it in the notes since the type 'attempt' doesn't exist
    const dbNotes = interactionType === 'attempt' 
        ? `[Attempt] ${finalNote}`.trim()
        : finalNote;

    // Direct insert
    const { data: insertData, error: insertError } = await (supabase as any)
      .from('interactions')
      .insert({
        person_id: personId,
        user_id: user.id,
        type: dbType, 
        date: new Date().toISOString(),
        notes: dbNotes
      })
      .select();

    if (insertError) {
        console.error('[logHeaderInteraction] Insert Primary Failed:', insertError.message);
        
        // Check for specific column error to give better feedback if schema is still wrong
        if (insertError.message.includes('column "date" does not exist')) {
             console.log("[logHeaderInteraction] Schema Mismatch detected. Trying fallback to 'interaction_date'...");
             // Fallback attempt
             const { data: fallbackData, error: fallbackError } = await (supabase as any)
              .from('interactions')
              .insert({
                person_id: personId,
                user_id: user.id,
                type: dbType,
                interaction_date: new Date().toISOString(),
                notes: dbNotes
              })
              .select();
              
              if (fallbackError) {
                console.error("[logHeaderInteraction] Fallback Insert Failed:", fallbackError);
                throw new Error(`Failed to insert interaction (Fallback): ${fallbackError.message}`);
              }
              console.log('[logHeaderInteraction] Fallback Insert SUCCESS:', fallbackData);
        } else {
             console.error("[logHeaderInteraction] Critical Insert Error:", insertError);
             throw new Error(`Failed to insert interaction: ${insertError.message}`);
        }
    } else {
        console.log('[logHeaderInteraction] Insert Primary SUCCESS:', insertData);
    }

    // 2. Shared Memory Log (User Narrative)
    // The original 'type' parameter is no longer available.
    // Assuming 'interactionType' from the new signature can be used for this logic.
    // The original logic used 'type === "attempt"'. We'll use 'interactionType === "attempt"' here.
    if (note || interactionType === 'attempt') {
        const memoryContent = interactionType === 'attempt' && !note
          ? `[Attempted Contact] No note left.` 
          : (interactionType === 'attempt' ? `[Attempted Contact] ${note}` : note);

        console.log('[logHeaderInteraction] Logging Shared Memory:', memoryContent);

        if (memoryContent) {
             const { error: memoryError } = await (supabase as any)
              .from("shared_memories")
              .insert({
                person_id: personId,
                user_id: user.id,
                content: memoryContent
              });
            
             if (memoryError) {
                 console.error("Memory Log Error:", memoryError);
             } else {
                 console.log("Memory Log SUCCESS");
             }
        }
    }

        // 3. Update Person Status (Only for connections)
    if (interactionType === 'connection') {
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
    revalidatePath('/contacts');
    revalidatePath(`/contacts/${personId}`);
    revalidatePath('/garden');
    revalidatePath('/'); // Revalidate home page

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
