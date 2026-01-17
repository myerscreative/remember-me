'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function deleteInteraction(interactionId: string, personId: string) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error("Delete interaction - auth error:", authError);
    return { success: false, error: "Unauthorized" };
  }

  console.log(`Attempting to delete interaction ${interactionId} for user ${user.id}`);

  try {
    // Delete the interaction (RLS policies will ensure user can only delete their own)
    const { data, error, count } = await (supabase as any)
      .from('interactions')
      .delete()
      .eq('id', interactionId)
      .eq('user_id', user.id)
      .select();

    console.log('Delete response:', { data, error, count });

    if (error) {
      console.error("Supabase delete error:", error);
      throw error;
    }

    console.log(`Successfully deleted interaction ${interactionId}`);

    revalidatePath(`/contacts/${personId}`);
    revalidatePath('/dashboard');
    revalidatePath('/network');

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting interaction:", error);
    return { success: false, error: error.message || "Unknown error" };
  }
}
