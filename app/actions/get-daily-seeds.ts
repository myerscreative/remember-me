'use server'

import { createClient } from '@/lib/supabase/server'

export interface SeedContact {
  id: string;
  name: string;
  importance: 'high' | 'medium' | 'low';
  daysAgo: number;
  score: number;
  reason: string;
}

export async function getDailySeeds(limit: number = 5): Promise<SeedContact[]> {
  const supabase =  await createClient(); // Await the async createClient
  
  // Fetch all active contacts
  const { data: persons, error } = await supabase
    .from('persons')
    .select('id, name, first_name, last_name, last_contact, last_interaction_date, importance')
    .eq('archived', false);

  if (error || !persons) {
    console.error("Error fetching seeds:", error);
    return [];
  }

  const now = new Date().getTime();

  // Calculate Scores
  const scoredContacts = persons.map((p: any) => {
    const dateStr = p.last_contact || p.last_interaction_date;
    const date = dateStr ? new Date(dateStr).getTime() : 0;
    const diffDays = dateStr ? Math.ceil(Math.abs(now - date) / (1000 * 60 * 60 * 24)) : 100; // Cap "never" at 100 or higher for weighting

    const importance = (p.importance as 'high' | 'medium' | 'low') || 'medium';

    // Weights & Targets
    let importanceWeight = 1.5;
    let targetFreq = 30;

    if (importance === 'high') {
      importanceWeight = 3.0;
      targetFreq = 14;
    } else if (importance === 'low') {
      importanceWeight = 0.5;
      targetFreq = 90;
    }

    // Health Ratio: How "late" are they?
    // Ratio > 1.0 means overdue.
    const ratio = diffDays / targetFreq;

    // Final Score
    const score = ratio * importanceWeight;

    return {
      id: p.id,
      name: p.name || `${p.first_name} ${p.last_name}`.trim(),
      importance,
      daysAgo: diffDays,
      score,
      // Debug reason for UI if needed
      reason: `Late by ${(ratio * 100).toFixed(0)}% (${diffDays}/${targetFreq}d)`
    };
  });

  // Sort Descending by Score
  scoredContacts.sort((a, b) => b.score - a.score);

  return scoredContacts.slice(0, limit);
}
