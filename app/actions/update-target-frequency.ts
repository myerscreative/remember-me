'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { validateUUID, targetFrequencySchema } from '@/lib/validations'

export async function updateTargetFrequency(personId: string, frequencyDays: number) {
  const supabase = await createClient()

  try {
    // ✅ SECURITY: Validate inputs
    const validatedPersonId = validateUUID(personId);
    const validationResult = targetFrequencySchema.safeParse(frequencyDays);

    if (!validationResult.success) {
      return { 
        success: false, 
        error: 'Invalid frequency value (must be 1-365 days)' 
      };
    }

    const { error } = await supabase
      .from('persons')
      .update({ target_frequency_days: validationResult.data })
      .eq('id', validatedPersonId)

    if (error) {
      console.error("Failed to update target frequency:", error)
      return { success: false, error: 'Failed to update target frequency' }
    }

    // Revalidate relevant paths
    revalidatePath('/garden')
    revalidatePath('/garden/setup')
    revalidatePath('/')

    return { success: true }
  } catch (error: unknown) {
    console.error('Error in updateTargetFrequency:', error);
    return { 
      success: false, 
      error: 'Failed to update target frequency. Please try again.' 
    };
  }
}
