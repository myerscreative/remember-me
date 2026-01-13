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
    return { success: false, error: 'Not authenticated' };
  }

  const now = new Date().toISOString();

  try {
    // Insert interaction record and update person's last_interaction_date in parallel
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [interactionResult, updateResult] = await Promise.all([
      (supabase as any).from('interactions').insert({
        person_id: personId,
        user_id: user.id,
        type,
        date: now, // Required: interaction timestamp
        // Map 'note' input to 'notes' column to match standard schema
        notes: note || null,
      }),
      (supabase as any).from('persons').update({
        last_interaction_date: now,
        last_contact: now.split('T')[0], // Also update last_contact for backwards compatibility
      }).eq('id', personId).eq('user_id', user.id),
    ]);

    if (interactionResult.error) {
      console.error('Error inserting interaction:', interactionResult.error);
      return { success: false, error: 'Failed to log interaction' };
    }

    if (updateResult.error) {
      console.error('Error updating person:', updateResult.error);
      return { success: false, error: 'Failed to update contact' };
    }

    // Revalidate the garden page to show updated positions
    revalidatePath('/garden');
    revalidatePath('/');
    
    return { success: true };
  } catch (err) {
    console.error('Error in logInteraction:', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
