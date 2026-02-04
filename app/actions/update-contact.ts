'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { updateContactSchema, validateUUID } from "@/lib/validations";

export async function updateContact(personId: string, data: unknown) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // ✅ SECURITY: Validate person ID to prevent injection
    const validatedPersonId = validateUUID(personId);

    // ✅ SECURITY: Validate and sanitize all input data
    const validationResult = updateContactSchema.safeParse(data);
    if (!validationResult.success) {
      const errorMessage = validationResult.error.issues
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join(", ");
      return { 
        success: false, 
        error: `Invalid contact data: ${errorMessage}` 
      };
    }

    const validatedData = validationResult.data;

    // Filter out undefined values to avoid overwriting with null
    const updateData: Record<string, unknown> = Object.fromEntries(
      Object.entries(validatedData).filter(([, v]) => v !== undefined)
    );

    const { error } = await supabase
      .from('persons')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', validatedPersonId)
      .eq('user_id', user.id); // ✅ SECURITY: Ensure user owns this contact

    if (error) throw error;

    revalidatePath(`/contacts/${validatedPersonId}`);
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: unknown) {
    console.error("Error updating contact:", error);
    // ✅ SECURITY: Don't leak internal error details to client
    return { 
      success: false, 
      error: "Failed to update contact. Please try again." 
    };
  }
}
