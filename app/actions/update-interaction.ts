'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { updateInteractionSchema } from "@/lib/validations";

export async function updateInteraction(
  interactionId: string,
  personId: string,
  data: unknown
) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // ✅ SECURITY: Validate all inputs
    const validationResult = updateInteractionSchema.safeParse({
      interactionId,
      ...(data as Record<string, unknown>)
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

    const { interactionId: validatedId, ...updateData } = validationResult.data;

    // Update the interaction (RLS policies will ensure user can only update their own)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('interactions')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', validatedId)
      .eq('user_id', user.id); // ✅ SECURITY: Ensure user owns this interaction

    if (error) throw error;

    revalidatePath(`/contacts/${personId}`);
    revalidatePath('/dashboard');
    revalidatePath('/network');

    return { success: true };
  } catch (error: unknown) {
    console.error("Error updating interaction:", error);
    // ✅ SECURITY: Don't leak internal error details
    return { 
      success: false, 
      error: "Failed to update interaction. Please try again." 
    };
  }
}
