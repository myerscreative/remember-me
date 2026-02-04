'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// ✅ SECURITY: Validation schema for milestones
const addMilestoneSchema = z.object({
  contactId: z.string().uuid("Invalid contact ID format"),
  milestone: z.object({
    title: z.string().trim().min(1, "Milestone title is required").max(200, "Title too long"),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid date format",
    }),
    type: z.enum(['Event', 'Goal', 'Life Change', 'Other']),
  }),
});

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
    // ✅ SECURITY: Validate inputs
    const validationResult = addMilestoneSchema.safeParse({ contactId, milestone });
    
    if (!validationResult.success) {
      return { 
        success: false, 
        error: `Invalid input: ${validationResult.error.issues.map(i => i.message).join(", ")}` 
      };
    }

    const { contactId: validatedContactId, milestone: validatedMilestone } = validationResult.data;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Facade: We are storing milestones in a 'milestones' JSONB column on the persons table.
    // 1. Fetch existing
    const { data: person, error: fetchError } = await (supabase as any)
      .from('persons')
      .select('milestones')
      .eq('id', validatedContactId)
      .eq('user_id', user.id) // ✅ SECURITY: Ensure user owns this contact
      .single();

    if (fetchError || !person) throw new Error("Contact or milestones not found");

    const existingMilestones: Milestone[] = ((person as any)?.milestones) || [];
    
    // 2. Add new
    const newMilestone: Milestone = {
        ...validatedMilestone,
        id: crypto.randomUUID(),
        status: 'Upcoming'
    };

    const updatedMilestones = [...existingMilestones, newMilestone];

    // 3. Update
    const { error: updateError } = await (supabase as any)
      .from('persons')
      .update({ milestones: updatedMilestones })
      .eq('id', validatedContactId)
      .eq('user_id', user.id); // ✅ SECURITY: Ensure user owns this contact

    if (updateError) throw updateError;

    revalidatePath(`/contacts/${validatedContactId}`);
    return { success: true, milestone: newMilestone };
  } catch (error) {
    console.error('Error adding milestone:', error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to add milestone" };
  }
}

