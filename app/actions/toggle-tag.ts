'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleTag(personId: string, tagName: string) {
  const supabase = await createClient()
  const name = tagName.toLowerCase().trim()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
      return { success: false, error: 'Not authenticated' }
  }

  // 1. Ensure the tag exists in the global table
  // Strategy: Try to find -> if missing, insert -> if race condition, find again
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let { data: tag, error } = await (supabase as any)
    .from('tags')
    .select()
    .eq('name', name)
    .single();

  if (error && error.code !== 'PGRST116') {
      console.error('Error finding tag:', error);
  }

  if (!tag) {
    // Attempt to insert
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newTag, error: insertError } = await (supabase as any)
      .from('tags')
      .insert({ name, user_id: user.id })
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
            .eq('name', name)
            .single();
            
        if (retryError || !retryTag) {
             console.error('Error fetching tag after conflict:', retryError);
             return { success: false, error: retryError?.message || 'Failed to retrieve tag' };
        }
        tag = retryTag;
      } else {
        console.error('Error creating tag:', insertError);
        return { success: false, error: insertError.message || 'Failed to create tag' };
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
    .eq('person_id', personId)
    .eq('tag_id', tag.id)
    .single()

  if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "Row not found"
      console.error('Error checking existing tag:', fetchError);
      return { success: false, error: fetchError.message || 'Failed to check existing tag' };
  }

  if (existing) {
    // Remove it
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: deleteError } = await (supabase as any)
        .from('person_tags')
        .delete()
        .match({ person_id: personId, tag_id: tag.id })
    
    if (deleteError) {
        console.error('Error removing tag:', deleteError);
        return { success: false, error: deleteError.message || 'Failed to remove tag' };
    }
  } else {
    // Add it
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: insertError } = await (supabase as any)
        .from('person_tags')
        .insert({ person_id: personId, tag_id: tag.id })
    
    if (insertError) {
         console.error('Error adding tag:', insertError);
         return { success: false, error: insertError.message || 'Failed to add tag' };
    }
  }

  revalidatePath(`/contacts/${personId}`)
  return { success: true }
}
