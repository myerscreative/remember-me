'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

interface UpdateInteractionData {
  date?: string;
  notes?: string;
}

export async function updateInteraction(
  interactionId: string,
  personId: string,
  data: UpdateInteractionData
) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Update the interaction (RLS policies will ensure user can only update their own)
    const { error } = await supabase
      .from('interactions')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', interactionId)
      .eq('user_id', user.id);

    if (error) throw error;

    revalidatePath(`/contacts/${personId}`);
    revalidatePath('/dashboard');
    revalidatePath('/network');

    return { success: true };
  } catch (error: any) {
    console.error("Error updating interaction:", error);
    return { success: false, error: error.message };
  }
}
