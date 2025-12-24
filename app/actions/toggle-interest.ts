'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleInterest(personId: string, interestName: string) {
  const supabase = await createClient()
  const name = interestName.toLowerCase().trim()

  // 1. Ensure the interest exists in the global table
  // Strategy: Try to find -> if missing, insert -> if race condition, find again
  // This avoids needing a global UPDATE RLS policy which `upsert` requires
  
  // Note: 'interests' table might not be in generated types yet, so casting to any for now
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let { data: interest, error: findError } = await (supabase as any)
    .from('interests')
    .select()
    .eq('name', name)
    .single();

  if (!interest) {
    // Attempt to insert
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newInterest, error: insertError } = await (supabase as any)
      .from('interests')
      .insert({ name })
      .select()
      .single();

    if (insertError) {
      // Check if it's a unique constraint violation (someone else just added it)
      if (insertError.code === '23505') { 
        // Retry fetch
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: retryInterest, error: retryError } = await (supabase as any)
            .from('interests')
            .select()
            .eq('name', name)
            .single();
            
        if (retryError || !retryInterest) {
             console.error('Error fetching interest after conflict:', retryError);
             return { success: false, error: 'Failed to retrieve interest' };
        }
        interest = retryInterest;
      } else {
        console.error('Error creating interest:', insertError);
        return { success: false, error: 'Failed to create interest' };
      }
    } else {
      interest = newInterest;
    }
  }

  // 2. Check if the link already exists
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing, error: fetchError } = await (supabase as any)
    .from('person_interests')
    .select()
    .eq('person_id', personId)
    .eq('interest_id', interest.id)
    .single()

  if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "Row not found"
      console.error('Error checking existing interest:', fetchError);
      return { success: false, error: 'Failed to check existing interest' };
  }

  if (existing) {
    // Remove it
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: deleteError } = await (supabase as any)
        .from('person_interests')
        .delete()
        .match({ person_id: personId, interest_id: interest.id })
    
    if (deleteError) {
        console.error('Error removing interest:', deleteError);
        return { success: false, error: 'Failed to remove interest' };
    }
  } else {
    // Add it
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: insertError } = await (supabase as any)
        .from('person_interests')
        .insert({ person_id: personId, interest_id: interest.id })
    
    if (insertError) {
         console.error('Error adding interest:', insertError);
         return { success: false, error: 'Failed to add interest' };
    }
  }

  revalidatePath(`/contacts/${personId}`)
  return { success: true }
}
