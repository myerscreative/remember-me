'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updatePersonImportance(personId: string, importance: 'high' | 'medium' | 'low') {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('persons')
    .update({ contact_importance: importance })
    .eq('id', personId)

  if (error) {
    console.error("Failed to update importance:", error)
    return { success: false, error: error.message }
  }

  // Revalidate both views
  revalidatePath('/triage')
  revalidatePath('/garden')

  return { success: true }
}
