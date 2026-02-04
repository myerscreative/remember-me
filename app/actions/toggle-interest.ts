'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { validateUUID, validateInterestName } from '@/lib/validations'

export async function toggleInterest(personId: string, interestName: string) {
  const supabase = await createClient()

  try {
    // ✅ SECURITY: Validate inputs
    const validatedPersonId = validateUUID(personId);
    const validatedInterestName = validateInterestName(interestName);
    const normalizedName = validatedInterestName.toLowerCase().trim();

    // 1. Ensure the interest exists in the global table
    let { data: interest, error: findError } = await supabase
      .from('interests')
      .select()
      .eq('name', normalizedName)
      .single();

    if (!interest) {
      // Attempt to insert
      const { data: newInterest, error: insertError } = await supabase
        .from('interests')
        .insert({ name: normalizedName })
        .select()
        .single();

      if (insertError) {
        // Check if it's a unique constraint violation (someone else just added it)
        if (insertError.code === '23505') { 
          // Retry fetch
          const { data: retryInterest, error: retryError } = await supabase
            .from('interests')
            .select()
            .eq('name', normalizedName)
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
    const { data: existing, error: fetchError } = await supabase
      .from('person_interests')
      .select()
      .eq('person_id', validatedPersonId)
      .eq('interest_id', interest.id)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "Row not found"
      console.error('Error checking existing interest:', fetchError);
      return { success: false, error: 'Failed to check existing interest' };
    }

    if (existing) {
      // Remove it
      const { error: deleteError } = await supabase
        .from('person_interests')
        .delete()
        .match({ person_id: validatedPersonId, interest_id: interest.id })
      
      if (deleteError) {
        console.error('Error removing interest:', deleteError);
        return { success: false, error: 'Failed to remove interest' };
      }
    } else {
      // Add it
      const { error: insertError } = await supabase
        .from('person_interests')
        .insert({ person_id: validatedPersonId, interest_id: interest.id })
      
      if (insertError) {
        console.error('Error adding interest:', insertError);
        return { success: false, error: 'Failed to add interest' };
      }
    }

    revalidatePath(`/contacts/${validatedPersonId}`)
    return { success: true }
  } catch (error: unknown) {
    console.error('Error in toggleInterest:', error);
    // ✅ SECURITY: Don't leak internal error details
    return { 
      success: false, 
      error: 'Failed to toggle interest. Please try again.' 
    };
  }
}
