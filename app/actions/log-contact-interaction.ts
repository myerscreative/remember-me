'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { logInteractionSchema } from "@/lib/validations";

export async function logContactInteraction(
  personId: string, 
  type: 'call' | 'email' | 'message' | 'meeting' | 'other',
  notes?: string,
  date?: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // ✅ SECURITY: Validate all inputs
    const validationResult = logInteractionSchema.safeParse({
      personId,
      type,
      notes,
      date
    });

    if (!validationResult.success) {
      const errorMessage = validationResult.error.issues
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join(", ");
      return { 
        success: false, 
        error: `Invalid interaction data: ${errorMessage}` 
      };
    }

    const validatedData = validationResult.data;

    // 1. Insert Interaction Record
    const { error: interactionError } = await supabase
      .from('interactions')
      .insert({
        person_id: validatedData.personId,
        user_id: user.id,
        type: validatedData.type,
        date: validatedData.date || new Date().toISOString(),
        notes: validatedData.notes || null
      });

    if (interactionError) throw interactionError;

    // 2. Update Person Status
    const { error: updateError } = await supabase
      .from('persons')
      .update({
        last_interaction_date: validatedData.date || new Date().toISOString(),
        last_contact_method: validatedData.type,
        updated_at: new Date().toISOString()
      })
      .eq('id', validatedData.personId)
      .eq('user_id', user.id); // ✅ SECURITY: Ensure user owns this contact

    if (updateError) throw updateError;

    revalidatePath('/dashboard');
    revalidatePath(`/contacts/${validatedData.personId}`);

    return { success: true };
  } catch (error: unknown) {
    console.error("Error logging interaction:", error);
    // ✅ SECURITY: Don't leak internal error details
    return { 
      success: false, 
      error: "Failed to log interaction. Please try again." 
    };
  }
}
