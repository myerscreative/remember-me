'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function deleteContact(contactId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Delete the contact (cascade will handle related records)
    const { error } = await (supabase as any)
      .from('persons')
      .delete()
      .eq('id', contactId)
      .eq('user_id', user.id); // Important: ensure user owns this contact

    if (error) {
      console.error('Error deleting contact:', error);
      return { success: false, error: error.message };
    }

    // Revalidate the contacts list page
    revalidatePath('/contacts');
    revalidatePath('/garden');

    return { success: true };
  } catch (error) {
    console.error('Error in deleteContact:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete contact' 
    };
  }
}
