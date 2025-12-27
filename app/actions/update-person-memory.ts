'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updatePersonMemory(personId: string, memoryText: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  if (!memoryText || !memoryText.trim()) {
      return { success: false, error: "Memory text is required" };
  }

  try {
    // 1. Fetch current notes
    const { data: person, error: fetchError } = await supabase
        .from('persons')
        .select('notes')
        .eq('id', personId)
        .eq('user_id', user.id)
        .single();
    
    if (fetchError) throw fetchError;

    // 2. Append new memory with timestamp
    const timestamp = new Date().toLocaleDateString();
    const newEntry = `[${timestamp}] ${memoryText.trim()}`;
    const updatedNotes = person.notes ? `${person.notes}\n\n${newEntry}` : newEntry;

    // 3. Update person
    const { error: updateError } = await supabase
        .from('persons')
        .update({ 
            notes: updatedNotes,
            // Optionally update last_interaction_date if this counts as interaction? 
            // User prompt says: "Clicking an icon should update 'Last contact'... but 'Memory Bar' ... automatically updates 'The Story'".
            // So we just update the story/notes here.
            updated_at: new Date().toISOString()
        })
        .eq('id', personId)
        .eq('user_id', user.id);

    if (updateError) throw updateError;

    revalidatePath('/dashboard');
    revalidatePath(`/contacts/${personId}`);
    
    return { success: true };

  } catch (error: any) {
    console.error("Error updating person memory:", error);
    return { success: false, error: error.message };
  }
}
