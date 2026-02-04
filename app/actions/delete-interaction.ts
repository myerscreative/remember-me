'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { validateUUID } from "@/lib/validations";

export async function deleteInteraction(interactionId: string, personId: string) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // ✅ SECURITY: Validate UUIDs to prevent injection
    const validatedInteractionId = validateUUID(interactionId);
    const validatedPersonId = validateUUID(personId);

    // Delete the interaction (RLS policies will ensure user can only delete their own)
    const { error } = await supabase
      .from('interactions')
      .delete()
      .eq('id', validatedInteractionId)
      .eq('user_id', user.id); // ✅ SECURITY: Ensure user owns this interaction

    if (error) {
      console.error("Supabase delete error:", error);
      // ✅ SECURITY: Don't leak internal error details
      return { success: false, error: "Failed to delete interaction" };
    }

    revalidatePath(`/contacts/${validatedPersonId}`);
    revalidatePath('/dashboard');
    revalidatePath('/network');

    return { success: true };
  } catch (error: unknown) {
    console.error("Error deleting interaction:", error);
    return { 
      success: false, 
      error: "Failed to delete interaction. Please try again." 
    };
  }
}
