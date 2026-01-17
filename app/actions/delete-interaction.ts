'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function deleteInteraction(interactionId: string, personId: string) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Delete the interaction (RLS policies will ensure user can only delete their own)
    const { error } = await (supabase as any)
      .from('interactions')
      .delete()
      .eq('id', interactionId)
      .eq('user_id', user.id);

    if (error) throw error;

    revalidatePath(`/contacts/${personId}`);
    revalidatePath('/dashboard');
    revalidatePath('/network');

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting interaction:", error);
    return { success: false, error: error.message };
  }
}
