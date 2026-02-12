'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { InteractionType } from '@/lib/relationship-health';

export interface LogInteractionInput {
  personId: string;
  type: InteractionType;
  note?: string;
  predictedResonance?: number;
}


export type InteractionResult = 
  | { success: true; error?: never }
  | { success: false; error: string; details?: any };

export async function logInteraction({ personId, type, note, date, predictedResonance }: LogInteractionInput & { date?: string }): Promise<InteractionResult> {
  const supabase = await createClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return { success: false, error: 'Not authenticated', details: userError };
  }

  // Use provided date or fallback to now
  const interactionDate = date ? new Date(date).toISOString() : new Date().toISOString();
  // For last_contact, we generally want the *latest* interaction date. 
  // However, if we are backdating, we should check if this is actually the latest interaction 
  // before updating the PERSON level stats. 
  // For simplicity (and typical user intent of "I forgot to log this yesterday"), 
  // we will update the person's last_interaction_date to this date IF it is newer than what they have,
  // OR if they haven't been contacted in a while. 
  // Actually, to keep it simple and consistent with user request "I need to set the date", 
  // we will trust the user. But wait, if they backdate to 2010, we don't want to reset "last_contact" to 2010 if they contacted them yesterday.
  
  // So: 
  // 1. Insert interaction with the specific date.
  // 2. Fetch current person data to compare dates.
  // 3. Only update person.last_interaction_date if the new date is AFTER the current last_interaction_date.

  try {
    // 1. Fetch current person stats
    const { data: person, error: personError } = await (supabase as any)
      .from('persons')
      .select('last_interaction_date')
      .eq('id', personId)
      .single();

    if (personError) throw personError;

    const currentLastInteraction = person.last_interaction_date ? new Date(person.last_interaction_date).getTime() : 0;
    const newInteractionTime = new Date(interactionDate).getTime();
    
    const shouldUpdatePersonStats = newInteractionTime > currentLastInteraction;

    // 2. Insert interaction
    const { data: newInteraction, error: insertError } = await (supabase as any).from('interactions').insert({
      person_id: personId,
      user_id: user.id,
      type,
      date: interactionDate,
      notes: note || null,
      is_inbound: false, // Explicitly outbound for outreach
    }).select('id').single();

    if (insertError) {
      console.error('Error inserting interaction:', insertError);
      return { success: false, error: insertError.message || 'Failed to log interaction', details: insertError };
    }

    // 2b. If predictedResonance provided, create Learning Ledger entry
    if (predictedResonance !== undefined && newInteraction) {
      const { error: ledgerError } = await (supabase as any).from('learning_ledger').insert({
        outreach_id: newInteraction.id,
        contact_id: personId,
        user_id: user.id,
        predicted_resonance: predictedResonance,
        actual_outcome: false,
      });

      if (ledgerError) console.error('Error creating ledger entry:', ledgerError);
    }

    // 3. Update person stats ONLY if this is a newer interaction
    if (shouldUpdatePersonStats) {
       const { error: updateError } = await (supabase as any).from('persons').update({
        last_interaction_date: interactionDate,
        last_contact: interactionDate.split('T')[0], 
      }).eq('id', personId).eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating person:', updateError);
        // We don't fail the whole request if just the person update fails, but we log it.
      }
    }

    // Revalidate
    revalidatePath('/garden');
    revalidatePath('/dashboard');
    revalidatePath('/admin/dashboard');
    revalidatePath('/');
    
    return { success: true };
  } catch (err: any) {
    console.error('Error in logInteraction:', err);
    return { success: false, error: err.message || 'An unexpected error occurred', details: err };
  }
}
