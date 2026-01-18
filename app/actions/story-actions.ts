'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Database } from "@/types/database.types";
import { processMemory } from './process-memory';

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


export async function updateStoryFields(contactId: string, fields: { where_met?: string; why_stay_in_contact?: string; most_important_to_them?: string; family_notes?: string; company?: string; job_title?: string; current_challenges?: string; goals_aspirations?: string; mutual_value_introductions?: string; core_values?: string[]; communication_style?: string; personality_notes?: string }) {
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

    // Auto-trigger AI summary refresh when story fields are updated
    // This runs in the background, don't await it
    try {
      const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      fetch(`${origin}/api/refresh-ai-summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId }),
      }).catch(err => console.error('Background AI refresh failed:', err));
    } catch (refreshError) {
      console.log('Could not trigger background AI refresh');
    }

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
      
      console.log('📝 [DEBUG] addSharedMemory: Adding for person', person_id, 'User:', user.id);

      const { error } = await (supabase as any)
        .from('shared_memories')
        .insert({
          person_id,
          user_id: user.id,
          content
        });

      if (error) throw error;

      // Auto-trigger AI processing to extract structured data from the brain dump
      try {
        console.log('🤖 [DEBUG] addSharedMemory: Triggering AI processing for:', person_id);
        await processMemory(person_id, content, false); // false = don't save again, just extract data
        console.log('✅ [DEBUG] addSharedMemory: AI processing complete');
      } catch (processError) {
        console.error('⚠️ [DEBUG] addSharedMemory: AI processing failed (non-fatal):', processError);
        // Don't fail the whole operation if AI processing fails
      }

      // Auto-trigger AI summary refresh when memories are added
      try {
        const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
        fetch(`${origin}/api/refresh-ai-summary`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contactId: person_id }),
        }).catch(err => console.error('Background AI refresh failed:', err));
      } catch (refreshError) {
        console.log('Could not trigger background AI refresh');
      }

      revalidatePath(`/contacts/${person_id}`);
      return { success: true };
    } catch (error: unknown) {
      console.error('❌ [DEBUG] addSharedMemory Error:', error);
      console.error('❌ [DEBUG] Error type:', typeof error);
      console.error('❌ [DEBUG] Error details:', JSON.stringify(error, null, 2));
      
      let message = "Unknown error";
      if (error instanceof Error) {
        message = error.message;
        console.error('❌ [DEBUG] Error message:', error.message);
        console.error('❌ [DEBUG] Error stack:', error.stack);
      } else if (typeof error === 'object' && error !== null) {
        message = JSON.stringify(error);
      }
      
      return { success: false, error: message };
    }
}

export async function addInterest(contactId: string, interest: string) {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
  
      if (!user || !user.id) throw new Error("Unauthorized");
  
      // Fetch current interests
      const { data: contact, error: fetchError } = await (supabase as any)
        .from('persons')
        .select('interests')
        .eq('id', contactId)
        .eq('user_id', user.id)
        .single();
  
      if (fetchError || !contact) throw fetchError || new Error("Contact not found");
  
      const currentInterests = Array.isArray(contact.interests) ? contact.interests : [];
      // Avoid duplicates
      if (currentInterests.some((i: string) => i.toLowerCase() === interest.toLowerCase())) {
          return { success: true, message: "Interest already exists" };
      }

      const newInterests = [...currentInterests, interest];
  
      const { error: updateError } = await (supabase as any)
        .from('persons')
        .update({ interests: newInterests }) // Assuming 'interests' is the column name (text array)
        .eq('id', contactId)
        .eq('user_id', user.id);
  
      if (updateError) throw updateError;
  
      revalidatePath(`/contacts/${contactId}`);
      return { success: true };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("Error adding interest:", error);
      return { success: false, error: message };
    }
}
