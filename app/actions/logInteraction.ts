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
    // Map interaction types to database schema
    const typeMapping: Record<InteractionType, string> = {
      'call': 'call',
      'email': 'email',
      'text': 'message',  // Map 'text' to 'message'
      'in-person': 'meeting',  // Map 'in-person' to 'meeting'
      'social': 'message',  // Map 'social' to 'message'
      'other': 'other'
    };

    const dbType = typeMapping[type];
    console.log('🔍 Attempting to log interaction:', { personId, type, dbType, note, nextGoal, userId: user.id });

    // Insert interaction record and update person's last_interaction_date in parallel
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [interactionResult, updateResult] = await Promise.all([
      (supabase as any).from('interactions').insert({
        person_id: personId,
        user_id: user.id,
        interaction_type: dbType,  // Use correct column name
        interaction_date: now,  // Use correct column name
        // Map 'note' input to 'notes' column to match standard schema
        notes: note || null,
      }),
      (supabase as any).from('persons').update({
        last_interaction_date: now,
        last_contact: now.split('T')[0], // Also update last_contact for backwards compatibility
      }).eq('id', personId).eq('user_id', user.id),
    ]);

    if (interactionResult.error) {
      console.error('❌ Database error inserting interaction:', {
        error: interactionResult.error,
        code: interactionResult.error?.code,
        message: interactionResult.error?.message,
        details: interactionResult.error?.details,
        hint: interactionResult.error?.hint,
      });
      return { success: false, error: `Database error: ${interactionResult.error.message || 'Failed to log interaction'}` };
    }

    if (updateResult.error) {
      console.error('Error updating person:', updateResult.error);
      return { success: false, error: 'Failed to update contact' };
    }

    console.log('✅ Interaction logged successfully');

    // Revalidate the garden page to show updated positions
    revalidatePath('/garden');
    revalidatePath('/');

    return { success: true };
  } catch (err) {
    console.error('Error in logInteraction:', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
