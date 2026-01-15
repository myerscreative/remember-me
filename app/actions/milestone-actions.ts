'use client';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export interface Milestone {
  id: string;
  title: string;
  date: string; // ISO string for storage
  type: 'Event' | 'Goal' | 'Life Change' | 'Other';
  status: 'Upcoming' | 'Occurred' | 'Acknowledged';
  reminderSent?: boolean;
}

export async function addMilestone(contactId: string, milestone: Omit<Milestone, 'id' | 'status'>) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Facade: We are storing milestones in a 'milestones' JSONB column on the persons table.
    // 1. Fetch existing
    const { data: person, error: fetchError } = await supabase
      .from('persons')
      .select('milestones')
      .eq('id', contactId)
      .single();

    if (fetchError) throw fetchError;

    const existingMilestones: Milestone[] = (person.milestones as any) || [];
    
    // 2. Add new
    const newMilestone: Milestone = {
        ...milestone,
        id: crypto.randomUUID(),
        status: 'Upcoming'
    };

    const updatedMilestones = [...existingMilestones, newMilestone];

    // 3. Update
    const { error: updateError } = await supabase
      .from('persons')
      .update({ milestones: updatedMilestones })
      .eq('id', contactId);

    if (updateError) throw updateError;

    revalidatePath(`/contacts/${contactId}`);
    return { success: true, milestone: newMilestone };
  } catch (error) {
    console.error('Error adding milestone:', error);
    return { success: false, error };
  }
}
