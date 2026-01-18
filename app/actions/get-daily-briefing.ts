'use server';

import { createClient } from "@/lib/supabase/server";
import { getMilestones, getTribeHealth, type Milestone, type TribeHealth } from "@/lib/dashboard/dashboardUtils";
import { Person } from "@/types/database.types";

export interface DailyBriefing {
  milestones: Milestone[];
  thirstyTribes: TribeHealth[];
  priorityNurtures: Person[];
}

export async function getDailyBriefing(options: { expanded?: boolean } = {}): Promise<{ data: DailyBriefing | null; error: string | null }> {
  try {
    const { expanded = false } = options;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: "Unauthorized" };
    }

    // 1. Get Milestones
    const milestonesResult = await getMilestones();
    let finalMilestones = milestonesResult.data || [];
    
    if (!expanded) {
       // Just today
       finalMilestones = finalMilestones.filter(m => m.daysRemaining === 0);
    } else {
       // Today + Next 7 Days
       finalMilestones = finalMilestones.filter(m => m.daysRemaining >= 0 && m.daysRemaining <= 7);
    }

    // 2. Get Tribe Health and filter for THIRSTY
    const tribesResult = await getTribeHealth();
    // In expanded mode, show ALL tribes, otherwise only thirsty ones? 
    // Actually, "Briefing" usually implies "Actionable". 
    // For now, let's keep it to Thirsty for both, maybe sort by urgency.
    // If expanded, maybe we show ALL tribes but highlight thirsty ones? 
    // Let's stick to Thirsty for now to keep it actionable.
    const thirstyTribes = (tribesResult.data || []).filter(t => t.isThirsty);

    // 3. Identify Priority Nurtures (Overdue Contacts)
    // Fetch all active contacts to filter in memory for dynamic thresholds
    const { data: contacts, error: contactsError } = await (supabase as any)
      .from('persons')
      .select('id, name, first_name, last_name, importance, last_interaction_date, last_contact_method, photo_url, target_frequency_days, deep_lore, relationship_summary')
      .eq('user_id', user.id)
      .or('archived.is.null,archived.eq.false,archive_status.is.null,archive_status.eq.false');

    if (contactsError) throw contactsError;

    const now = new Date();
    const needsNurture = (contacts || []).filter((c: any) => {
        // If never contacted, it depends on creation date? 
        // For now, let's assume 'New' contacts (null date) are NOT fading unless explicitly marked.
        // Actually, if last_interaction_date is null, let's treat as 'needs nurture' if it's been a while since creation?
        // To coincide with dashboardUtils, dashboardUtils includes them if sorted nullsFirst.
        // Let's stick to explicit Overdue for the Briefing (since it's high priority).
        if (!c.last_interaction_date) return false; 

        const lastDate = new Date(c.last_interaction_date);
        const diffTime = Math.abs(now.getTime() - lastDate.getTime());
        const daysAgo = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let threshold = c.target_frequency_days || 30;
        if (!c.target_frequency_days) {
            if (c.importance === 'high') threshold = 14;
            else if (c.importance === 'low') threshold = 90;
        }
        
        return daysAgo >= threshold;
    });

    // Sort by Urgency (Importance first, then days overdue relative to threshold)
    const sortedNurtures = needsNurture.sort((a: any, b: any) => {
        const impMap: Record<string, number> = { high: 3, medium: 2, low: 1 };
        const impA = impMap[a.importance] || 0;
        const impB = impMap[b.importance] || 0;
        
        if (impB !== impA) return impB - impA; // High importance first
        
        // Then by raw date (older is more urgent)
        const dateA = new Date(a.last_interaction_date).getTime();
        const dateB = new Date(b.last_interaction_date).getTime();
        return dateA - dateB; 
    });

    const limitFading = expanded ? 10 : 3;
    const finalFading = sortedNurtures.slice(0, limitFading);

    return {
      data: {
        milestones: finalMilestones,
        thirstyTribes,
        priorityNurtures: finalFading as Person[]
      },
      error: null
    };
  } catch (error: any) {
    console.error("Error generating daily briefing:", error);
    return { data: null, error: error.message || "Failed to generate briefing" };
  }
}
