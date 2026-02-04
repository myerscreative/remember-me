'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { validateUUID, validateTagName } from '@/lib/validations'

export async function toggleTag(personId: string, tagName: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  try {
    // ✅ SECURITY: Validate inputs
    const validatedPersonId = validateUUID(personId);
    const validatedTagName = validateTagName(tagName);
    const normalizedName = validatedTagName.toLowerCase().trim();

    // 1. Ensure the tag exists in the global table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let { data: tag, error } = await (supabase as any)
      .from('tags')
      .select()
      .eq('name', normalizedName)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error finding tag:', error);
      return { success: false, error: 'Failed to find tag' };
    }

    if (!tag) {
      // Attempt to insert
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: newTag, error: insertError } = await (supabase as any)
        .from('tags')
        .insert({ name: normalizedName, user_id: user.id })
        .select()
        .single();

      if (insertError) {
        // Check if it's a unique constraint violation
        if (insertError.code === '23505') {
          // Retry fetch
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: retryTag, error: retryError } = await (supabase as any)
            .from('tags')
            .select()
            .eq('name', normalizedName)
            .single();
            
          if (retryError || !retryTag) {
            console.error('Error fetching tag after conflict:', retryError);
            return { success: false, error: 'Failed to retrieve tag' };
          }
          tag = retryTag;
        } else {
          console.error('Error creating tag:', insertError);
          return { success: false, error: 'Failed to create tag' };
        }
      } else {
        tag = newTag;
      }
    }

    // 2. Check if the link already exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing, error: fetchError } = await (supabase as any)
      .from('person_tags')
      .select()
      .eq('person_id', validatedPersonId)
      .eq('tag_id', tag.id)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "Row not found"
      console.error('Error checking existing tag:', fetchError);
      return { success: false, error: 'Failed to check existing tag' };
    }

    if (existing) {
      // Remove it
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: deleteError } = await (supabase as any)
        .from('person_tags')
        .delete()
        .match({ person_id: validatedPersonId, tag_id: tag.id })

      if (deleteError) {
        console.error('Error removing tag:', deleteError);
        return { success: false, error: 'Failed to remove tag' };
      }
    } else {
      // Add it
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertError } = await (supabase as any)
        .from('person_tags')
        .insert({ person_id: validatedPersonId, tag_id: tag.id })
      
      if (insertError) {
        console.error('Error adding tag:', insertError);
        return { success: false, error: 'Failed to add tag' };
      }
    }

    revalidatePath(`/contacts/${validatedPersonId}`)
    return { success: true }
  } catch (error: unknown) {
    console.error('Error in toggleTag:', error);
    // ✅ SECURITY: Don't leak internal error details
    return { 
      success: false, 
      error: 'Failed to toggle tag. Please try again.' 
    };
  }
}
