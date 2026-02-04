'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Database } from "@/types/database.types";
import { processMemory } from './process-memory';
import { z } from "zod";

type Person = Database['public']['Tables']['persons']['Row'];

// ✅ SECURITY: Validation schemas
const updateDeepLoreSchema = z.object({
  contactId: z.string().uuid("Invalid contact ID format"),
  content: z.string().trim().max(10000, "Content too long"),
});

const appendStoryNoteSchema = z.object({
  contactId: z.string().uuid("Invalid contact ID format"),
  content: z.string().trim().min(1, "Note cannot be empty").max(5000, "Note too long"),
});

const storyMilestoneSchema = z.object({
  contactId: z.string().uuid("Invalid contact ID format"),
  label: z.string().trim().min(1, "Label is required").max(100, "Label too long"),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
});

export async function updateDeepLore(contactId: string, content: string) {
  try {
    // ✅ SECURITY: Validate inputs
    const validationResult = updateDeepLoreSchema.safeParse({ contactId, content });
    
    if (!validationResult.success) {
      return { 
        success: false, 
        error: `Invalid input: ${validationResult.error.issues.map(i => i.message).join(", ")}` 
      };
    }

    const { contactId: validatedContactId, content: validatedContent } = validationResult.data;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.id) throw new Error("Unauthorized");

    const { error } = await (supabase as any)
      .from('persons')
      .update({ deep_lore: validatedContent })
      .eq('id', validatedContactId)
      .eq('user_id', user.id);

    if (error) throw error;

    revalidatePath(`/contacts/${validatedContactId}`);
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error updating deep lore:", error);
    return { success: false, error: message };
  }
}

export async function appendStoryNote(contactId: string, content: string) {
  try {
    // ✅ SECURITY: Validate inputs
    const validationResult = appendStoryNoteSchema.safeParse({ contactId, content });
    
    if (!validationResult.success) {
      return { 
        success: false, 
        error: `Invalid input: ${validationResult.error.issues.map(i => i.message).join(", ")}` 
      };
    }

    const { contactId: validatedContactId, content: validatedContent } = validationResult.data;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.id) throw new Error("Unauthorized");

    // Fetch current lore
    const { data: contact, error: fetchError } = await (supabase as any)
      .from('persons')
      .select('deep_lore, name')
      .eq('id', validatedContactId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !contact) throw new Error("Contact not found");

    const timestamp = new Date().toLocaleDateString();
    const newLore = contact.deep_lore 
      ? `${contact.deep_lore}\n\n[ ${timestamp} ]\n${validatedContent}`
      : `[ ${timestamp} ]\n${validatedContent}`;

    const { error: updateError } = await (supabase as any)
      .from('persons')
      .update({ deep_lore: newLore })
      .eq('id', validatedContactId)
      .eq('user_id', user.id);

    if (updateError) throw updateError;

    revalidatePath(`/contacts/${validatedContactId}`);
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
    // ✅ SECURITY: Validate inputs
    const validationResult = storyMilestoneSchema.safeParse({ contactId, label, date });
    
    if (!validationResult.success) {
      return { 
        success: false, 
        error: `Invalid input: ${validationResult.error.issues.map(i => i.message).join(", ")}` 
      };
    }

    const { contactId: validatedContactId, label: validatedLabel, date: validatedDate } = validationResult.data;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.id) throw new Error("Unauthorized");

    // Get current contact info to check important_dates
    const { data: contact, error: fetchError } = await (supabase as any)
      .from('persons')
      .select('birthday, custom_anniversary, important_dates')
      .eq('id', validatedContactId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !contact) throw new Error("Contact not found");

    const updates: Partial<Person> = {};
    const labelLower = validatedLabel.toLowerCase();

    if (labelLower === 'birthday') {
      updates.birthday = validatedDate;
    } else if (labelLower === 'anniversary') {
      updates.custom_anniversary = validatedDate;
    } else {
      const currentDates = Array.isArray(contact.important_dates) ? contact.important_dates : [];
      updates.important_dates = [...currentDates, { label: validatedLabel, date: validatedDate }];
    }

    const { error: updateError } = await (supabase as any)
      .from('persons')
      .update(updates)
      .eq('id', validatedContactId)
      .eq('user_id', user.id);

    if (updateError) throw updateError;

    revalidatePath(`/contacts/${validatedContactId}`);
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error adding milestone:", error);
    return { success: false, error: message };
  }
}


// ✅ SECURITY: Remaining validation schemas
const deleteMilestoneSchema = z.object({
  contactId: z.string().uuid("Invalid contact ID format"),
  label: z.string().trim().min(1, "Label is required"),
  date: z.string().trim().min(1, "Date is required"),
});

const sharedMemorySchema = z.object({
  personId: z.string().uuid("Invalid person ID format"),
  content: z.string().trim().min(1, "Content is required").max(20000, "Content too long"),
});

const updateStoryFieldsSchema = z.object({
  contactId: z.string().uuid("Invalid contact ID format"),
  fields: z.object({
    where_met: z.string().trim().max(1000, "Where met too long").optional(),
    why_stay_in_contact: z.string().trim().max(1000, "Why stay in contact too long").optional(),
    most_important_to_them: z.string().trim().max(1000, "Most important too long").optional(),
    family_notes: z.string().trim().max(1000, "Family notes too long").optional(),
    company: z.string().trim().max(200, "Company name too long").optional(),
    job_title: z.string().trim().max(200, "Job title too long").optional(),
    current_challenges: z.string().trim().max(1000, "Current challenges too long").optional(),
    goals_aspirations: z.string().trim().max(1000, "Goals/aspirations too long").optional(),
    mutual_value_introductions: z.string().trim().max(1000, "Mutual value introductions too long").optional(),
    core_values: z.array(z.string().trim().max(100, "Core value too long")).max(50, "Too many core values").optional(),
    communication_style: z.string().trim().max(500, "Communication style too long").optional(),
    personality_notes: z.string().trim().max(1000, "Personality notes too long").optional(),
  }),
});

const addInterestSchema = z.object({
  contactId: z.string().uuid("Invalid contact ID format"),
  interest: z.string().trim().min(1, "Interest cannot be empty").max(100, "Interest name too long"),
});

export async function deleteMilestone(contactId: string, label: string, date: string) {
    try {
      // ✅ SECURITY: Validate inputs
      const validationResult = deleteMilestoneSchema.safeParse({ contactId, label, date });
      
      if (!validationResult.success) {
        return { 
          success: false, 
          error: `Invalid input: ${validationResult.error.issues.map(i => i.message).join(", ")}` 
        };
      }

      const { contactId: validatedContactId, label: validatedLabel, date: validatedDate } = validationResult.data;

      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
  
      if (!user || !user.id) throw new Error("Unauthorized");
  
      const { data: contact, error: fetchError } = await (supabase as any)
        .from('persons')
        .select('birthday, custom_anniversary, important_dates')
        .eq('id', validatedContactId)
        .eq('user_id', user.id)
        .single();
  
      if (fetchError || !contact) throw new Error("Contact not found");
  
      const updates: Partial<Person> = {};
      const labelLower = validatedLabel.toLowerCase();
  
      if (labelLower === 'birthday' && contact.birthday === validatedDate) {
        updates.birthday = null;
      } else if (labelLower === 'anniversary' && contact.custom_anniversary === validatedDate) {
        updates.custom_anniversary = null;
      } else {
        const currentDates = Array.isArray(contact.important_dates) ? contact.important_dates : [];
        updates.important_dates = (currentDates as any[]).filter((d: any) => !(d.label === validatedLabel && d.date === validatedDate));
      }
  
      const { error: updateError } = await (supabase as any)
        .from('persons')
        .update(updates)
        .eq('id', validatedContactId)
        .eq('user_id', user.id);
  
      if (updateError) throw updateError;
  
      revalidatePath(`/contacts/${validatedContactId}`);
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
    // ✅ SECURITY: Validate inputs
    const validationResult = sharedMemorySchema.safeParse({ personId: person_id, content });
    
    if (!validationResult.success) {
      return { 
        success: false, 
        error: `Invalid input: ${validationResult.error.issues.map(i => i.message).join(", ")}` 
      };
    }

    const { personId: validatedPersonId, content: validatedContent } = validationResult.data;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.id) throw new Error("Unauthorized");

    const { error } = await (supabase as any)
      .from('shared_memories')
      .upsert({ 
        person_id: validatedPersonId, 
        user_id: user.id, 
        content: validatedContent 
      }, { onConflict: 'person_id, user_id' }); // Assuming we want one main memory context per person/user

    if (error) throw error;

    revalidatePath(`/contacts/${validatedPersonId}`);
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error upserting shared memory:", error);
    return { success: false, error: message };
  }
}


export async function updateStoryFields(contactId: string, fields: { where_met?: string; why_stay_in_contact?: string; most_important_to_them?: string; family_notes?: string; company?: string; job_title?: string; current_challenges?: string; goals_aspirations?: string; mutual_value_introductions?: string; core_values?: string[]; communication_style?: string; personality_notes?: string }) {
  try {
    // ✅ SECURITY: Validate inputs
    const validationResult = updateStoryFieldsSchema.safeParse({ contactId, fields });
    
    if (!validationResult.success) {
      return { 
        success: false, 
        error: `Invalid input: ${validationResult.error.issues.map(i => i.message).join(", ")}` 
      };
    }

    const { contactId: validatedContactId, fields: validatedFields } = validationResult.data;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.id) throw new Error("Unauthorized");

    const { error } = await (supabase as any)
      .from('persons')
      .update(validatedFields)
      .eq('id', validatedContactId)
      .eq('user_id', user.id);

    if (error) throw error;

    // Auto-trigger AI summary refresh when story fields are updated
    // This runs in the background, don't await it
    try {
      const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      fetch(`${origin}/api/refresh-ai-summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId: validatedContactId }),
      }).catch(err => console.error('Background AI refresh failed:', err));
    } catch (refreshError) {
      console.log('Could not trigger background AI refresh');
    }

    revalidatePath(`/contacts/${validatedContactId}`);
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error updating story fields:", error);
    return { success: false, error: message };
  }
}

export async function addSharedMemory(person_id: string, content: string) {
    try {
      // ✅ SECURITY: Validate inputs
      const validationResult = sharedMemorySchema.safeParse({ personId: person_id, content });
      
      if (!validationResult.success) {
        return { 
          success: false, 
          error: `Invalid input: ${validationResult.error.issues.map(i => i.message).join(", ")}` 
        };
      }
  
      const { personId: validatedPersonId, content: validatedContent } = validationResult.data;

      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user || !user.id) throw new Error("Unauthorized");
      
      console.log('📝 [DEBUG] addSharedMemory: Adding for person', validatedPersonId, 'User:', user.id);

      const { error } = await (supabase as any)
        .from('shared_memories')
        .insert({
          person_id: validatedPersonId,
          user_id: user.id,
          content: validatedContent
        });

      if (error) throw error;

      // Auto-trigger AI processing to extract structured data from the brain dump
      try {
        await processMemory(validatedPersonId, validatedContent, false); // false = don't save again, just extract data
      } catch (processError) {
        // Don't fail the whole operation if AI processing fails
        console.error('AI processing failed:', processError);
      }

      // Auto-trigger AI summary refresh when memories are added
      try {
        const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
        fetch(`${origin}/api/refresh-ai-summary`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contactId: validatedPersonId }),
        }).catch(err => console.error('Background AI refresh failed:', err));
      } catch (refreshError) {
        console.log('Could not trigger background AI refresh');
      }

      revalidatePath(`/contacts/${validatedPersonId}`);
      return { success: true };
    } catch (error: unknown) {
      console.error('❌ [DEBUG] addSharedMemory Error:', error);
      
      let message = "Unknown error";
      if (error instanceof Error) {
        message = error.message;
      } else if (typeof error === 'object' && error !== null) {
        message = JSON.stringify(error);
      }
      
      return { success: false, error: message };
    }
}

export async function addInterest(contactId: string, interest: string) {
    try {
      // ✅ SECURITY: Validate inputs
      const validationResult = addInterestSchema.safeParse({ contactId, interest });
      
      if (!validationResult.success) {
        return { 
          success: false, 
          error: `Invalid input: ${validationResult.error.issues.map(i => i.message).join(", ")}` 
        };
      }

      const { contactId: validatedContactId, interest: validatedInterest } = validationResult.data;

      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
  
      if (!user || !user.id) throw new Error("Unauthorized");
  
      // Fetch current interests
      const { data: contact, error: fetchError } = await (supabase as any)
        .from('persons')
        .select('interests')
        .eq('id', validatedContactId)
        .eq('user_id', user.id)
        .single();
  
      if (fetchError || !contact) throw new Error("Contact not found");
  
      const currentInterests = Array.isArray(contact.interests) ? contact.interests : [];
      // Avoid duplicates
      if (currentInterests.some((i: string) => i.toLowerCase() === validatedInterest.toLowerCase())) {
          return { success: true, message: "Interest already exists" };
      }

      const newInterests = [...currentInterests, validatedInterest];
  
      const { error: updateError } = await (supabase as any)
        .from('persons')
        .update({ interests: newInterests }) // Assuming 'interests' is the column name (text array)
        .eq('id', validatedContactId)
        .eq('user_id', user.id);
  
      if (updateError) throw updateError;
  
      revalidatePath(`/contacts/${validatedContactId}`);
      return { success: true };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("Error adding interest:", error);
      return { success: false, error: message };
    }
}

