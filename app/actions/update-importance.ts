'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { validateUUID, importanceSchema } from '@/lib/validations'

export async function updatePersonImportance(
  personId: string, 
  importance: 'high' | 'medium' | 'low' | 'critical'
) {
  const supabase = await createClient()

  try {
    // ✅ SECURITY: Validate inputs
    const validatedPersonId = validateUUID(personId);
    const validationResult = importanceSchema.safeParse(importance);

    if (!validationResult.success) {
      return { 
        success: false, 
        error: 'Invalid importance level' 
      };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('persons')
      .update({ importance: validationResult.data })
      .eq('id', validatedPersonId)

    if (error) {
      console.error("Failed to update importance:", error)
      return { success: false, error: 'Failed to update importance' }
    }

    // Revalidate both views
    revalidatePath('/triage')
    revalidatePath('/garden')

    return { success: true }
  } catch (error: unknown) {
    console.error('Error in updatePersonImportance:', error);
    return { 
      success: false, 
      error: 'Failed to update importance. Please try again.' 
    };
  }
}
