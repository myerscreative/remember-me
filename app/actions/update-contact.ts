'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

interface UpdateContactData {
  email?: string;
  phone?: string;
  birthday?: string;
  company?: string;
  job_title?: string;
  where_met?: string;
}

export async function updateContact(personId: string, data: UpdateContactData) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const { error } = await supabase
      .from('persons')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', personId)
      .eq('user_id', user.id);

    if (error) throw error;

    revalidatePath(`/contacts/${personId}`);
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error("Error updating contact:", error);
    return { success: false, error: error.message };
  }
}
