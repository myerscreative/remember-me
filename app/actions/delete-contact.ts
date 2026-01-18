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

    // Soft delete: set deleted_at timestamp instead of actually deleting
    // Contact can be recovered within 30 days
    const { error } = await (supabase as any)
      .from('persons')
      .update({ deleted_at: new Date().toISOString() })
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

export async function restoreContact(contactId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Restore contact by clearing deleted_at
    const { error } = await (supabase as any)
      .from('persons')
      .update({ deleted_at: null })
      .eq('id', contactId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error restoring contact:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/contacts');
    revalidatePath('/garden');

    return { success: true };
  } catch (error) {
    console.error('Error in restoreContact:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to restore contact' 
    };
  }
}

export async function permanentlyDeleteContact(contactId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Permanently delete the contact (cascade will handle related records)
    const { error } = await (supabase as any)
      .from('persons')
      .delete()
      .eq('id', contactId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error permanently deleting contact:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/contacts');
    revalidatePath('/garden');

    return { success: true };
  } catch (error) {
    console.error('Error in permanentlyDeleteContact:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to permanently delete contact' 
    };
  }
}
