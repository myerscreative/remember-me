'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { InteractionType } from '@/lib/relationship-health';

interface LogGroupInteractionInput {
  contactIds: string[];
  type: InteractionType;
  note?: string;
  nextGoalNote?: string | null;
}

/**
 * Log an interaction for multiple contacts at once (e.g., family dinner)
 * Updates last_interaction_date and creates interaction records for all contacts
 */
export async function logGroupInteraction({ contactIds, type, note, nextGoalNote }: LogGroupInteractionInput): Promise<{
  success: boolean;
  updatedCount?: number;
  error?: string;
}> {
  const supabase = await createClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return { success: false, error: 'Not authenticated' };
  }

  if (!contactIds || contactIds.length === 0) {
    return { success: false, error: 'No contacts provided' };
  }

  const now = new Date().toISOString();

  try {
    // Update all contacts' last_interaction_date in parallel
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatePromises = contactIds.map(id =>
      (supabase as any)
        .from('persons')
        .update({
          last_interaction_date: now,
          last_contact: now.split('T')[0], // backwards compatibility
        })
        .eq('id', id)
        .eq('user_id', user.id)
    );

    // Insert interaction records for all contacts
    const interactionRecords = contactIds.map(id => ({
      person_id: id,
      user_id: user.id,
      type,
      // DB column is 'notes' (plural) in 2025 migration, but 'note' (singular) in 2023 migration
      // If table created by 2025 migration, it needs 'notes'.
      // If we use 'notes', we cover the likely case that 2025 migration ran first.
      notes: note || `Group interaction with ${contactIds.length} contacts`,
      next_goal_note: nextGoalNote || null,
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const failedUpdates = updateResults.filter((r: any) => r.error);
    if (failedUpdates.length > 0) {
      console.error('Some contact updates failed:', failedUpdates);
    }

    // Revalidate affected paths
    revalidatePath('/garden');
    revalidatePath('/');
    contactIds.forEach(id => {
      revalidatePath(`/contacts/${id}`);
    });

    return { 
      success: true, 
      updatedCount: contactIds.length - failedUpdates.length 
    };
  } catch (err) {
    console.error('Error in logGroupInteraction:', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
