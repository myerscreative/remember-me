'use server';

import { createClient } from '@/lib/supabase/server';

export async function scheduleNextContact(
  contactId: string,
  nextContactDate: string, // ISO date string (YYYY-MM-DD)
  nextContactReason?: string
) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return {
        success: false,
        error: 'Authentication required'
      };
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(nextContactDate)) {
      return {
        success: false,
        error: 'Invalid date format. Expected YYYY-MM-DD'
      };
    }

    // Validate date is not in the past
    const selectedDate = new Date(nextContactDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      return {
        success: false,
        error: 'Next contact date cannot be in the past'
      };
    }

    // Update the contact's next_contact_date and next_contact_reason
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from('persons')
      .update({
        next_contact_date: nextContactDate,
        next_contact_reason: nextContactReason || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', contactId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error scheduling next contact:', updateError);
      return {
        success: false,
        error: 'Failed to schedule next contact'
      };
    }

    return {
      success: true,
      data: {
        nextContactDate,
        nextContactReason
      }
    };
  } catch (error) {
    console.error('Exception in scheduleNextContact:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
