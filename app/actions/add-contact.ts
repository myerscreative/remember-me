'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from "zod";

const quickAddSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name is too long"),
});

export async function addContact(name: string): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const validationResult = quickAddSchema.safeParse({ name });
    
    if (!validationResult.success) {
      return { 
        success: false, 
        error: validationResult.error.issues[0].message 
      };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.id) {
      return { success: false, error: "User not authenticated" };
    }

    // Attempt to split into first and last name if there's a space
    const nameParts = name.trim().split(' ');
    const firstName = nameParts.length > 0 ? nameParts[0] : name.trim();
    let lastName: string | undefined = undefined;
    if (nameParts.length > 1) {
      lastName = nameParts.slice(1).join(' ');
    }

    const nowIso = new Date().toISOString();

    const { data, error } = await supabase
      .from('persons')
      .insert({
        user_id: user.id,
        name: name.trim(),
        first_name: firstName,
        last_name: lastName,
        imported: false,
        has_context: false,
        // Explicitly initialize nullable contact timestamps.
        // Health logic uses created_at as baseline until first real interaction.
        last_contact: null,
        last_interaction_date: null,
        created_at: nowIso,
        updated_at: nowIso,
        // Default cadence: 30 (Monthly)
        target_frequency_days: 30,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to create quick contact:', error);
      return { success: false, error: 'Failed to add contact.' };
    }

    revalidatePath('/network');
    
    return { success: true, id: data.id };

  } catch (error: any) {
    console.error('Fatal addContact error:', error);
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
}
