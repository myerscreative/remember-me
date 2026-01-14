'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { InteractionType } from '@/lib/relationship-health';

interface LogInteractionInput {
  personId: string;
  type: InteractionType;
  note?: string;
  nextGoal?: string; // New field
}

export async function logInteraction({ personId, type, note, nextGoal }: LogInteractionInput) {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error('[logInteraction] Authentication error:', userError);
    return { success: false, error: 'Not authenticated' };
  }

  const now = new Date().toISOString();

  // Debug logging
  console.log('[logInteraction] Starting with params:', {
    personId,
    type,
    note: note?.substring(0, 50),
    nextGoal: nextGoal?.substring(0, 50),
    userId: user.id,
    timestamp: now
  });

  try {
    // Try inserting without next_goal_note first to see if that's the issue
    const insertData: any = {
      person_id: personId,
      user_id: user.id,
      type,
      date: now,
      notes: note || null,
    };

    // Only add next_goal_note if it's provided (to handle missing column gracefully)
    if (nextGoal) {
      insertData.next_goal_note = nextGoal;
    }

    console.log('[logInteraction] Insert data:', insertData);

    // Insert interaction record and update person's last_interaction_date in parallel
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [interactionResult, updateResult] = await Promise.all([
      (supabase as any).from('interactions').insert(insertData),
      (supabase as any).from('persons').update({
        last_interaction_date: now,
        last_contact: now.split('T')[0], // Also update last_contact for backwards compatibility
      }).eq('id', personId).eq('user_id', user.id),
    ]);

    if (interactionResult.error) {
      console.error('[logInteraction] Database error details:', {
        message: interactionResult.error.message,
        details: interactionResult.error.details,
        hint: interactionResult.error.hint,
        code: interactionResult.error.code,
        fullError: JSON.stringify(interactionResult.error, null, 2)
      });
      return {
        success: false,
        error: `Failed to log interaction: ${interactionResult.error.message || 'Database error'}`,
        details: interactionResult.error.details
      };
    }

    if (updateResult.error) {
      console.error('[logInteraction] Error updating person:', {
        message: updateResult.error.message,
        details: updateResult.error.details,
        hint: updateResult.error.hint,
        code: updateResult.error.code
      });
      return { success: false, error: 'Failed to update contact' };
    }

    console.log('[logInteraction] Success! Interaction logged.');

    // Revalidate the garden page to show updated positions
    revalidatePath('/garden');
    revalidatePath('/');

    return { success: true };
  } catch (err) {
    console.error('[logInteraction] Unexpected error:', err);
    return { success: false, error: `An unexpected error occurred: ${err instanceof Error ? err.message : 'Unknown error'}` };
  }
}
