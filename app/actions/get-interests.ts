'use server'

import { createClient } from '@/lib/supabase/server'

export interface Interest {
  id: string
  name: string
}

export async function getInterestsForContact(contactId: string) {
  const supabase = await createClient()

  // Fetch person_interests join with interests
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('person_interests')
    .select(`
      interest_id,
      interests (
        id,
        name
      )
    `)
    .eq('person_id', contactId)

  if (error) {
    console.error('Error fetching interests:', error)
    return []
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((item: any) => ({
    id: item.interests.id,
    name: item.interests.name
  })) as Interest[]
}

export async function searchInterests(query: string) {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('interests')
    .select('id, name')
    .ilike('name', `%${query}%`)
    .limit(10)

  if (error) {
    console.error('Error searching interests:', error)
    return []
  }

  return data as Interest[]
}
