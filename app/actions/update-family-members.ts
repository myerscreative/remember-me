'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateFamilyMembers(contactId: string, familyMembers: any[]) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.id) throw new Error("Unauthorized");

    const { error } = await (supabase as any)
      .from('persons')
      .update({ family_members: familyMembers })
      .eq('id', contactId)
      .eq('user_id', user.id);

    if (error) throw error;

    revalidatePath(`/contacts/${contactId}`);
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error updating family members:", error);
    return { success: false, error: message };
  }
}
