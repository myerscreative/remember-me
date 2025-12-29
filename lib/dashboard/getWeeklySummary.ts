import { createClient } from "@/lib/supabase/client";

export interface WeeklySummary {
  person_id: string;
  name: string;
  photo_url: string | null;
  notes: string[];
  total_interactions: number;
  current_health: 'blooming' | 'nourished' | 'thirsty' | 'fading';
  days_since_last: number;
}

export async function getWeeklySummary(): Promise<{ data: WeeklySummary[]; error: Error | null }> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { data: [], error: new Error("User not authenticated") };
    }

    // 1. Get interactions from the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: interactions, error: interactionsError } = await (supabase as any)
      .from('interactions')
      .select(`
        id,
        date,
        notes,
        person_id,
        persons (
          id,
          name,
          photo_url,
          last_interaction_date,
          target_frequency_days,
          deep_lore,
          importance
        )
      `)
      .eq('user_id', user.id)
      .gte('date', sevenDaysAgo.toISOString())
      .not('notes', 'is', null)
      .neq('notes', ''); // Only care about interactions with meaningful notes

    if (interactionsError) throw interactionsError;

    if (!interactions || interactions.length === 0) {
      return { data: [], error: null };
    }

    // 2. Group by person and aggregate notes
    const personMap = new Map<string, WeeklySummary>();
    const personDetailsMap = new Map<string, any>(); // To store person object for updates

    // Process interactions
    for (const interaction of interactions) {
      const person = interaction.persons;
      if (!person) continue;

      if (!personMap.has(person.id)) {
        // Calculate initial health status
        const lastDate = person.last_interaction_date ? new Date(person.last_interaction_date) : new Date();
        const daysSince = Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Determine health based on target frequency or default importnace
        let threshold = person.target_frequency_days;
        if (!threshold) {
             const imp = person.importance;
             threshold = imp === 'high' ? 14 : imp === 'low' ? 90 : 30;
        }

        let health: 'blooming' | 'nourished' | 'thirsty' | 'fading' = 'nourished';
        if (daysSince <= 7) health = 'blooming';
        else if (daysSince <= threshold) health = 'nourished';
        else if (daysSince <= threshold * 2) health = 'thirsty';
        else health = 'fading';

        personMap.set(person.id, {
          person_id: person.id,
          name: person.name,
          photo_url: person.photo_url,
          notes: [],
          total_interactions: 0,
          current_health: health,
          days_since_last: daysSince
        });
        
        personDetailsMap.set(person.id, person);
      }

      const entry = personMap.get(person.id)!;
      entry.total_interactions++;
      if (interaction.notes) {
        // Clean note
        const note = interaction.notes.trim();
        // Avoid duplicates if multiple interactions have same note
        if (!entry.notes.includes(note)) {
            entry.notes.push(note);
        }
      }
    }

    // 3. Update deep_lore if needed (Auto-Contextualization)
    // The requirement says: "extract unique 'person_id' and 'notes' to update the 'deep_lore' field"
    // We will append new notes to deep_lore if they aren't already there.
    
    const updatePromises: any[] = [];

    for (const [id, summary] of personMap.entries()) {
        const person = personDetailsMap.get(id);
        const newNotes = summary.notes.join('\n\n');
        
        if (!newNotes) continue;

        const currentLore = person.deep_lore || '';
        
        // Simple check to avoid duplicating existing lore if the note is already present
        // In a real AI system we'd use embedding semantic check, but here valid string includes check
        const notesToAppend = summary.notes.filter(n => !currentLore.includes(n));
        
        if (notesToAppend.length > 0) {
            const updatedLore = currentLore 
                ? `${currentLore}\n\n--- Weekly Update (${new Date().toLocaleDateString()}) ---\n${notesToAppend.join('\n')}`
                : `--- Weekly Update (${new Date().toLocaleDateString()}) ---\n${notesToAppend.join('\n')}`;

            updatePromises.push(
                (supabase as any)
                    .from('persons')
                    .update({ deep_lore: updatedLore })
                    .eq('id', id)
            );
        }
    }

    // Execute updates in parallel (fire and forget for dashboard speed, or await?)
    // Await ensures data consistency before return.
    await Promise.allSettled(updatePromises);

    return { 
      data: Array.from(personMap.values()), 
      error: null 
    };

  } catch (error) {
    console.error("Error generating weekly summary:", error);
    return { data: [], error: error instanceof Error ? error : new Error("Unknown error") };
  }
}
