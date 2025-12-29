import { createClient } from "@/lib/supabase/client";

export interface Drifter {
  id: string;
  name: string;
  photo_url: string | null;
  days_overdue: number; // or negative if expiring soon
  target_frequency_days: number;
  last_interaction_date: string | null;
  // Fields needed for ReachOutPanel fallback
  deep_lore: string | null;
  why_stay_in_contact: string | null;
  relationship_summary: string | null;
  shared_memories: any[]; // basic array for now
  ai_summary: string | null;
  where_met: string | null;
}

export async function getCriticalDrifters(): Promise<{ data: Drifter[]; error: Error | null }> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { data: [], error: new Error("User not authenticated") };
    }

    // Fetch all contacts to calculate expiration client-side (for now, safer than complex SQL date math)
    // We need standard fields + context for the script generator
    const { data: contacts, error } = await (supabase as any)
      .from('persons')
      .select(`
        id,
        name,
        photo_url,
        last_interaction_date,
        target_frequency_days,
        importance,
        deep_lore,
        why_stay_in_contact,
        relationship_summary,
        ai_summary,
        where_met,
        shared_memories ( content )
      `)
      .eq('user_id', user.id)
      .or('archive_status.is.null,archive_status.eq.false');

    if (error) throw error;

    const drifters: Drifter[] = [];
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    for (const person of (contacts || [])) {
      if (!person.last_interaction_date) continue; // New or never contacted users aren't "drifting" yet in this critical sense, or are handled by "New" lists

      // Effective Target
      let target = person.target_frequency_days;
      if (!target) {
        const imp = person.importance;
        target = imp === 'high' ? 14 : imp === 'low' ? 90 : 30; // Default fallbacks
      }

      const lastDate = new Date(person.last_interaction_date).getTime();
      const expirationDate = lastDate + (target * oneDayMs);
      const timeUntilExpiration = expirationDate - now;

      // Logic: "Identify persons whose ... is within 24 hours of CURRENT_DATE"
      // This usually means "About to expire in < 24h" or "Just expired < 24h ago"?
      // "Within 24 hours of CURRENT_DATE" implies strict proximity.
      // Let's interpret as:  -24h < timeUntilExpiration < 24h
      // i.e., Expired recently OR Expiring very soon.
      // Actually, "Critical Drifter" usually implies urgency BEFORE it falls apart or RIGHT AS it falls.
      // Let's catch those expiring within the next 24 hours (0 to 24h remaining)
      // AND those who expired in the last 48 hours (0 to -48h).
      
      const hoursRemaining = timeUntilExpiration / (1000 * 60 * 60);

      // Condition: Expiring soon (less than 24h left) or Overdue slightly (up to -48h i.e. 2 days late)
      // If they are 30 days late, they are in the "Neglected" bucket, not this "Urgent/Critical" nudge.
      // This is a "Tipping Point" list.
      if (hoursRemaining < 24 && hoursRemaining > -48) {
          drifters.push({
              id: person.id,
              name: person.name,
              photo_url: person.photo_url,
              days_overdue: Math.floor(hoursRemaining / -24), // 0 if expiring today, 1 if yesterday
              target_frequency_days: target,
              last_interaction_date: person.last_interaction_date,
              deep_lore: person.deep_lore,
              why_stay_in_contact: person.why_stay_in_contact,
              relationship_summary: person.relationship_summary,
              shared_memories: person.shared_memories || [],
              ai_summary: person.ai_summary,
              where_met: person.where_met
          });
      }
    }

    return { data: drifters, error: null };

  } catch (error) {
    console.error("Error fetching critical drifters:", error);
    return { data: [], error: error instanceof Error ? error : new Error("Unknown error") };
  }
}
