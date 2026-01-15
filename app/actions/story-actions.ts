'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Database } from "@/types/database.types";

type Person = Database['public']['Tables']['persons']['Row'];

export async function updateDeepLore(contactId: string, content: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.id) throw new Error("Unauthorized");

    const { error } = await (supabase as any)
      .from('persons')
      .update({ deep_lore: content })
      .eq('id', contactId)
      .eq('user_id', user.id);

    if (error) throw error;

    revalidatePath(`/contacts/${contactId}`);
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error updating deep lore:", error);
    return { success: false, error: message };
  }
}

export async function appendStoryNote(contactId: string, content: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.id) throw new Error("Unauthorized");

    // Fetch current lore
    const { data: contact, error: fetchError } = await (supabase as any)
      .from('persons')
      .select('deep_lore, name')
      .eq('id', contactId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !contact) throw fetchError || new Error("Contact not found");

    const timestamp = new Date().toLocaleDateString();
    const newLore = contact.deep_lore 
      ? `${contact.deep_lore}\n\n[ ${timestamp} ]\n${content}`
      : `[ ${timestamp} ]\n${content}`;

    const { error: updateError } = await (supabase as any)
      .from('persons')
      .update({ deep_lore: newLore })
      .eq('id', contactId)
      .eq('user_id', user.id);

    if (updateError) throw updateError;

    revalidatePath(`/contacts/${contactId}`);
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error appending story note:", error);
    return { success: false, error: message };
  }
}

export async function addMilestone(contactId: string, label: string, date: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.id) throw new Error("Unauthorized");

    // Get current contact info to check important_dates
    const { data: contact, error: fetchError } = await (supabase as any)
      .from('persons')
      .select('birthday, custom_anniversary, important_dates')
      .eq('id', contactId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !contact) throw fetchError || new Error("Contact not found");

    const updates: Partial<Person> = {};
    const labelLower = label.toLowerCase();

    if (labelLower === 'birthday') {
      updates.birthday = date;
    } else if (labelLower === 'anniversary') {
      updates.custom_anniversary = date;
    } else {
      const currentDates = Array.isArray(contact.important_dates) ? contact.important_dates : [];
      updates.important_dates = [...currentDates, { label, date }];
    }

    const { error: updateError } = await (supabase as any)
      .from('persons')
      .update(updates)
      .eq('id', contactId)
      .eq('user_id', user.id);

    if (updateError) throw updateError;

    revalidatePath(`/contacts/${contactId}`);
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error adding milestone:", error);
    return { success: false, error: message };
  }
}

export async function deleteMilestone(contactId: string, label: string, date: string) {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
  
      if (!user || !user.id) throw new Error("Unauthorized");
  
      const { data: contact, error: fetchError } = await (supabase as any)
        .from('persons')
        .select('birthday, custom_anniversary, important_dates')
        .eq('id', contactId)
        .eq('user_id', user.id)
        .single();
  
      if (fetchError || !contact) throw fetchError || new Error("Contact not found");
  
      const updates: Partial<Person> = {};
      const labelLower = label.toLowerCase();
  
      if (labelLower === 'birthday' && contact.birthday === date) {
        updates.birthday = null;
      } else if (labelLower === 'anniversary' && contact.custom_anniversary === date) {
        updates.custom_anniversary = null;
      } else {
        const currentDates = Array.isArray(contact.important_dates) ? contact.important_dates : [];
        updates.important_dates = (currentDates as any[]).filter((d: any) => !(d.label === label && d.date === date));
      }
  
      const { error: updateError } = await (supabase as any)
        .from('persons')
        .update(updates)
        .eq('id', contactId)
        .eq('user_id', user.id);
  
      if (updateError) throw updateError;
  
      revalidatePath(`/contacts/${contactId}`);
      revalidatePath('/dashboard');
      return { success: true };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("Error deleting milestone:", error);
      return { success: false, error: message };
    }
}

export async function upsertSharedMemory(person_id: string, content: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.id) throw new Error("Unauthorized");

    const { error } = await (supabase as any)
      .from('shared_memories')
      .upsert({ 
        person_id, 
        user_id: user.id, 
        content 
      }, { onConflict: 'person_id, user_id' }); // Assuming we want one main memory context per person/user

    if (error) throw error;

    revalidatePath(`/contacts/${person_id}`);
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error upserting shared memory:", error);
    return { success: false, error: message };
  }
}

export async function updateStoryFields(contactId: string, fields: { where_met?: string; why_stay_in_contact?: string; most_important_to_them?: string; family_notes?: string }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.id) throw new Error("Unauthorized");

    const { error } = await (supabase as any)
      .from('persons')
      .update(fields)
      .eq('id', contactId)
      .eq('user_id', user.id);

    if (error) throw error;

    revalidatePath(`/contacts/${contactId}`);
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error updating story fields:", error);
    return { success: false, error: message };
  }
}

export async function addSharedMemory(person_id: string, content: string) {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
  
      if (!user || !user.id) throw new Error("Unauthorized");
  
      const { error } = await (supabase as any)
        .from('shared_memories')
        .insert({ 
          person_id, 
          user_id: user.id, 
          content 
        });
  
      if (error) throw error;
  
      revalidatePath(`/contacts/${person_id}`);
      return { success: true };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("Error adding shared memory:", error);
      return { success: false, error: message };
    }
}
