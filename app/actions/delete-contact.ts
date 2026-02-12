'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { validateUUID } from '@/lib/validations';

export async function deleteContact(contactId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // ✅ SECURITY: Validate UUID to prevent injection
    const validatedId = validateUUID(contactId);

    // Soft delete: set deleted_at timestamp instead of actually deleting
    // Contact can be recovered within 30 days
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('persons')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', validatedId)
      .eq('user_id', user.id); // ✅ SECURITY: Ensure user owns this contact

    if (error) {
      console.error('Error deleting contact:', error);
      // ✅ SECURITY: Don't leak internal error details
      return { success: false, error: 'Failed to delete contact' };
    }

    // Revalidate the contacts list page
    revalidatePath('/contacts');
    revalidatePath('/garden');
    revalidatePath('/dashboard');
    revalidatePath('/admin/dashboard');

    return { success: true };
  } catch (error) {
    console.error('Error in deleteContact:', error);
    return { 
      success: false, 
      error: 'Failed to delete contact. Please try again.' 
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

    // ✅ SECURITY: Validate UUID to prevent injection
    const validatedId = validateUUID(contactId);

    // Restore contact by clearing deleted_at
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('persons')
      .update({ deleted_at: null })
      .eq('id', validatedId)
      .eq('user_id', user.id); // ✅ SECURITY: Ensure user owns this contact

    if (error) {
      console.error('Error restoring contact:', error);
      return { success: false, error: 'Failed to restore contact' };
    }

    revalidatePath('/contacts');
    revalidatePath('/garden');
    revalidatePath('/dashboard');
    revalidatePath('/admin/dashboard');

    return { success: true };
  } catch (error) {
    console.error('Error in restoreContact:', error);
    return { 
      success: false, 
      error: 'Failed to restore contact. Please try again.' 
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

    // ✅ SECURITY: Validate UUID to prevent injection
    const validatedId = validateUUID(contactId);

    // Permanently delete the contact (cascade will handle related records)
    const { error } = await supabase
      .from('persons')
      .delete()
      .eq('id', validatedId)
      .eq('user_id', user.id); // ✅ SECURITY: Ensure user owns this contact

    if (error) {
      console.error('Error permanently deleting contact:', error);
      return { success: false, error: 'Failed to permanently delete contact' };
    }

    revalidatePath('/contacts');
    revalidatePath('/garden');
    revalidatePath('/dashboard');
    revalidatePath('/admin/dashboard');

    return { success: true };
  } catch (error) {
    console.error('Error in permanentlyDeleteContact:', error);
    return { 
      success: false, 
      error: 'Failed to permanently delete contact. Please try again.' 
    };
  }
}
