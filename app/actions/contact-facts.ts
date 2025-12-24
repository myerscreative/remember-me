'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

type FactCategory = 'career' | 'family' | 'interest' | 'goal' | 'general';

interface AddFactInput {
  contactId: string;
  category: FactCategory;
  content: string;
}

export async function addContactFact({ contactId, category, content }: AddFactInput) {
  const supabase = await createClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    // Type assertion needed until `supabase gen types` is run after migration
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('contact_facts')
      .insert({
        contact_id: contactId,
        category,
        content,
      });

    if (error) {
      console.error('Error adding fact:', error);
      return { success: false, error: 'Failed to add fact' };
    }

    revalidatePath(`/contacts/${contactId}`);
    return { success: true };
  } catch (err) {
    console.error('Error in addContactFact:', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function deleteContactFact(factId: string, contactId: string) {
  const supabase = await createClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    // Type assertion needed until `supabase gen types` is run after migration
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('contact_facts')
      .delete()
      .eq('id', factId);

    if (error) {
      console.error('Error deleting fact:', error);
      return { success: false, error: 'Failed to delete fact' };
    }

    revalidatePath(`/contacts/${contactId}`);
    return { success: true };
  } catch (err) {
    console.error('Error in deleteContactFact:', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
