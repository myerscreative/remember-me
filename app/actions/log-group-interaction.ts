'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from "zod";

// ✅ SECURITY: Validation schema for group interactions
const logGroupInteractionSchema = z.object({
  contactIds: z.array(z.string().uuid("Invalid contact ID format")).min(1, "At least one contact is required").max(100, "Too many contacts"),
  type: z.enum(['call', 'text', 'meeting', 'gift', 'other']),
  summary: z.string().trim().min(1, "Summary is required").max(1000, "Summary too long"),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }).optional(),
});

/**
 * Log an interaction for multiple contacts at once (e.g., family dinner)
 * Updates last_interaction_date and creates interaction records for all contacts
 */
export async function logGroupInteraction(params: {
  contactIds: string[];
  type: 'call' | 'text' | 'meeting' | 'gift' | 'other' | 'in-person' | 'social';
  note?: string;
  date?: string;
}): Promise<{
  success: boolean;
  updatedCount?: number;
  error?: string;
}> {
  try {
    // ✅ SECURITY: Validate inputs
    const validationResult = logGroupInteractionSchema.safeParse({ 
      contactIds: params.contactIds, 
      type: params.type, 
      summary: params.note || '', 
      date: params.date 
    });
    
    if (!validationResult.success) {
      return { 
        success: false, 
        error: `Invalid input: ${validationResult.error.issues.map(i => i.message).join(", ")}` 
      };
    }

    const { contactIds: validatedContactIds, type: validatedType, summary: validatedSummary, date: validatedDate } = validationResult.data;

    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user || !user.id) {
      return { success: false, error: 'Not authenticated' };
    }

    const interactionDate = validatedDate || new Date().toISOString();
    const lastContactDate = interactionDate.split('T')[0];

    // 1. Update all contacts' last interaction info
    const updatePromises = validatedContactIds.map(id =>
      (supabase as any)
        .from('persons')
        .update({
          last_interaction_date: interactionDate,
          last_contact: lastContactDate,
        })
        .eq('id', id)
        .eq('user_id', user.id)
    );

    // 2. Insert interaction records for all contacts
    const interactionRecords = validatedContactIds.map(id => ({
      person_id: id,
      user_id: user.id,
      type: validatedType,
      notes: validatedSummary,
      date: interactionDate,
    }));

    const insertPromise = (supabase as any)
      .from('interactions')
      .insert(interactionRecords);

    // Execute all in parallel
    const [insertResult, ...updateResults] = await Promise.all([
      insertPromise,
      ...updatePromises
    ]);

    if (insertResult.error) {
      console.error('Error inserting group interactions:', insertResult.error);
      return { success: false, error: 'Failed to log interactions' };
    }

    const failedUpdates = updateResults.filter((r: any) => r.error);
    if (failedUpdates.length > 0) {
      console.error('Some contact updates failed:', failedUpdates);
    }

    // Revalidate affected paths
    revalidatePath('/garden');
    revalidatePath('/');
    validatedContactIds.forEach(id => {
      revalidatePath(`/contacts/${id}`);
    });

    return { 
      success: true, 
      updatedCount: validatedContactIds.length - failedUpdates.length 
    };
  } catch (err) {
    console.error('Error in logGroupInteraction:', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

