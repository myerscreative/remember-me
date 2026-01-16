'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { InteractionType } from '@/lib/relationship-health';

interface LogInteractionInput {
  personId: string;
  type: InteractionType;
  note?: string;
  // nextGoal removed - column doesn't exist in database
}


export type InteractionResult = 
  | { success: true; error?: never }
  | { success: false; error: string; details?: any };

export async function logInteraction({ personId, type, note }: LogInteractionInput): Promise<InteractionResult> {
  const supabase = await createClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return { success: false, error: 'Not authenticated', details: userError };
  }

  const now = new Date().toISOString();

  try {
    // Insert interaction record and update person's last_interaction_date in parallel
    // NOTE: Using 'interaction_type' and 'interaction_date' to match deployed DB schema
    // Local DB may have been migrated to 'type' and 'date', but deployed hasn't
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [interactionResult, updateResult] = await Promise.all([
      (supabase as any).from('interactions').insert({
        person_id: personId,
        user_id: user.id,
        interaction_type: type,  // Changed from 'type'
        interaction_date: now,   // Changed from 'date'
        // Map 'note' input to 'notes' column to match standard schema
        notes: note || null,
        // next_goal_note removed - column doesn't exist in database schema
      }),
      (supabase as any).from('persons').update({
        last_interaction_date: now,
        last_contact: now.split('T')[0], // Also update last_contact for backwards compatibility
      }).eq('id', personId).eq('user_id', user.id),
    ]);

    if (interactionResult.error) {
      console.error('Error inserting interaction:', interactionResult.error);
      return { success: false, error: interactionResult.error.message || 'Failed to log interaction', details: interactionResult.error };
    }

    if (updateResult.error) {
      console.error('Error updating person:', updateResult.error);
      return { success: false, error: updateResult.error.message || 'Failed to update contact', details: updateResult.error };
    }

    // Revalidate the garden page to show updated positions
    revalidatePath('/garden');
    revalidatePath('/');
    
    return { success: true };
  } catch (err: any) {
    console.error('Error in logInteraction:', err);
    return { success: false, error: err.message || 'An unexpected error occurred', details: err };
  }
}
