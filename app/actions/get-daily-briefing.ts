'use server';

import { createClient } from "@/lib/supabase/server";
import { getMilestones, getTribeHealth, type Milestone, type TribeHealth } from "@/lib/dashboard/dashboardUtils";
import { Person } from "@/types/database.types";

export interface DailyBriefing {
  milestones: Milestone[];
  thirstyTribes: TribeHealth[];
  priorityNurtures: Person[];
}

export async function getDailyBriefing(): Promise<{ data: DailyBriefing | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: "Unauthorized" };
    }

    // 1. Get Milestones and filter for TODAY
    const milestonesResult = await getMilestones();
    const todayMilestones = (milestonesResult.data || []).filter(m => m.daysRemaining === 0);

    // 2. Get Tribe Health and filter for THIRSTY
    const tribesResult = await getTribeHealth();
    const thirstyTribes = (tribesResult.data || []).filter(t => t.isThirsty);

    // 3. Identify Top 3 Fading Contacts
    // "Fading" = last interaction > 120 days ago
    const oneHundredTwentyDaysAgo = new Date();
    oneHundredTwentyDaysAgo.setDate(oneHundredTwentyDaysAgo.getDate() - 120);

    const fadingResult = await supabase
      .from('persons')
      .select('*')
      .eq('user_id', user.id)
      .or('archive_status.is.null,archive_status.eq.false')
      .lt('last_interaction_date', oneHundredTwentyDaysAgo.toISOString())
      .order('importance', { ascending: false })
      .limit(10);
    
    const fadingContacts = fadingResult.data as Person[] | null;
    const fadingError = fadingResult.error;

    if (fadingError) throw fadingError;

    // Further sort by importance (mapped to numeric)
    const sortedFading = (fadingContacts || []).sort((a, b) => {
      const impMap = { high: 3, medium: 2, low: 1 };
      const impA = impMap[a.importance as keyof typeof impMap] || 0;
      const impB = impMap[b.importance as keyof typeof impMap] || 0;
      
      if (impB !== impA) return impB - impA;
      
      // Secondary sort: oldest interaction first
      const dateA = a.last_interaction_date ? new Date(a.last_interaction_date).getTime() : 0;
      const dateB = b.last_interaction_date ? new Date(b.last_interaction_date).getTime() : 0;
      return dateA - dateB;
    }).slice(0, 3);

    return {
      data: {
        milestones: todayMilestones,
        thirstyTribes,
        priorityNurtures: sortedFading as Person[]
      },
      error: null
    };
  } catch (error: any) {
    console.error("Error generating daily briefing:", error);
    return { data: null, error: error.message || "Failed to generate briefing" };
  }
}
