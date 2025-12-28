'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateTargetFrequency(personId: string, frequencyDays: number) {
  const supabase = await createClient()

  const { error } = await (supabase as any)
    .from('persons')
    .update({ target_frequency_days: frequencyDays })
    .eq('id', personId)

  if (error) {
    console.error("Failed to update target frequency:", error)
    return { success: false, error: error.message }
  }

  // Revalidate relevant paths
  revalidatePath('/garden')
  revalidatePath('/garden/setup')
  revalidatePath('/')

  return { success: true }
}
