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
    console.error('Authentication error:', userError);
    return { success: false, error: 'Not authenticated' };
  }

  const now = new Date().toISOString();

  try {
    // Log the data we're about to insert for debugging
    const insertData = {
      person_id: personId,
      user_id: user.id,
      type,
      notes: note || null,
    };
    console.log('Attempting to insert interaction:', JSON.stringify(insertData, null, 2));

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
      console.error('Error inserting interaction - Full error:', JSON.stringify(interactionResult.error, null, 2));
      console.error('Error details:', {
        message: interactionResult.error.message,
        details: interactionResult.error.details,
        hint: interactionResult.error.hint,
        code: interactionResult.error.code,
      });
      return { success: false, error: `Failed to log interaction: ${interactionResult.error.message}` };
    }

    if (updateResult.error) {
      console.error('Error updating person - Full error:', JSON.stringify(updateResult.error, null, 2));
      console.error('Error details:', {
        message: updateResult.error.message,
        details: updateResult.error.details,
        hint: updateResult.error.hint,
        code: updateResult.error.code,
      });
      return { success: false, error: `Failed to update contact: ${updateResult.error.message}` };
    }

    console.log('Successfully inserted interaction:', interactionResult.data);
    console.log('Successfully updated person');

    // Revalidate the garden page to show updated positions
    revalidatePath('/garden');
    revalidatePath('/');

    return { success: true };
  } catch (err) {
    console.error('Error in logInteraction - Caught exception:', err);
    return { success: false, error: `An unexpected error occurred: ${err instanceof Error ? err.message : String(err)}` };
  }
}
