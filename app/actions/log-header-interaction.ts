'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function logHeaderInteraction(
  personId: string, 
  type: 'connection' | 'attempt',
  note?: string
) {
  const supabase = await createClient();
  
  // DIAGNOSTIC LOGGING
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  console.log(`[DIAGNOSTIC] LogInteraction Init - URL: ${supabaseUrl ? 'Set' : 'MISSING'}, AnonKey: ${hasAnonKey ? 'Set' : 'MISSING'}`);

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError) {
    console.error("[DIAGNOSTIC] Auth Check Failed:", {
      message: authError.message,
      status: authError.status,
      name: authError.name
    });
  }

  if (!user) {
    console.error("[DIAGNOSTIC] No user session found");
    return { success: false, error: "Unauthorized - No active session" };
  }

  console.log(`[DIAGNOSTIC] User Authenticated: ${user.id}`);

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
    // Type assertion needed due to Supabase client type resolution issue
    // NOTE: Using 'interaction_type' and 'interaction_date' to match deployed DB schema
    // Local DB may have been migrated to 'type' and 'date', but deployed hasn't
    const { data: insertData, error: insertError } = await (supabase as any)
      .from('interactions')
      .insert({
        person_id: personId,
        user_id: user.id,
        type: interactionType,  // Changed from 'interaction_type'
        date: new Date().toISOString(),  // Changed from 'interaction_date'
        notes: finalNote
      })
      .select();

    if (insertError) {
        console.error("Error logging interaction record:", {
            code: insertError.code,
            message: insertError.message,
            details: insertError.details,
            hint: insertError.hint
        });
        throw new Error(`Failed to insert interaction: ${insertError.message} (Code: ${insertError.code})`);
    }

    console.log('Interaction inserted successfully:', insertData);

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
        error: error.message,
        details: error 
    };
  }
}
