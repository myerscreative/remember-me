"use server"

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createQuickLog(contactId: string, content: string) {
  if (!content || content.trim().length === 0) {
    return { error: "Memory cannot be empty." };
  }

  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { error: "Not authenticated" };
    }

    // 1. Create the Memory and Update Contact Health
    // Note: Supabase doesn't support multi-table transactions in a single JS call as easily as Prisma's $transaction,
    // but we can use RPC or sequential calls for this MVP. Given the "Atomic Update" requirement, 
    // a small sequential execution is usually fine for this use case if we don't have a complex RPC ready.
    
    // Create Memory
    const { error: memoryError } = await supabase
      .from('shared_memories')
      .insert({
        person_id: contactId,
        user_id: user.id,
        content: content.trim(),
        is_quick_log: true
      });

    if (memoryError) throw memoryError;

    // Update Contact
    const { error: contactError } = await supabase
      .from('persons')
      .update({
        last_interaction_date: new Date().toISOString(),
        last_contact: new Date().toISOString().split('T')[0],
        health_status: 'NURTURED'
      })
      .eq('id', contactId)
      .eq('user_id', user.id);

    if (contactError) throw contactError;

    // 2. Refresh the Dashboard and Garden Map
    revalidatePath("/dashboard");
    revalidatePath("/garden");
    revalidatePath("/");

    return { success: true };
  } catch (error: any) {
    console.error("Failed to log memory:", error);
    return { error: error.message || "System error: The Garden couldn't be updated." };
  }
}
