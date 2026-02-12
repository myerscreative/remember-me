'use server';
import { createClient } from '@/lib/supabase/server';

export interface CommunityVitalSigns {
  pulseScore: number;
  referralVelocity: number;
  skillCloud: { name: string; count: number }[];
  networkDensity: number;
  gardenHealth: {
    nurtured: number;
    drifting: number;
    neglected: number;
  };
  bridgeActivity: {
    dates: string[];
    requests: number[];
    approvals: number[];
  };
  topConnectors: {
    name: string;
    avatar: string | null;
    referrals: number;
  }[];
}

/**
 * Aggregates community-wide data for the Admin Dashboard.
 * All data is anonymized to respect privacy.
 */
export async function getCommunityVitalSigns(): Promise<CommunityVitalSigns> {
  const supabase = await createClient();

  // 1. Calculate 'Pulse' (Active users vs total)
  const { count: totalUsers } = await supabase
    .from('user_stats')
    .select('*', { count: 'exact', head: true });

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count: activeUsers } = await supabase
    .from('user_stats')
    .select('*', { count: 'exact', head: true })
    .gte('last_activity_date', sevenDaysAgo);

  // 2. Network Density
  const { count: actualConnections } = await supabase
    .from('relationships')
    .select('*', { count: 'exact', head: true });

  const n = totalUsers || 1;
  const potentialConnections = (n * (n - 1)) / 2 || 1;
  const density = (actualConnections || 0) / potentialConnections;

  // 3. Aggregate Top Skills (Top 10 tags/interests across the group)
  const { data: allPersonTags } = await supabase
    .from('person_tags')
    .select('tag_id, tags(name)') as { data: any[] | null };
  
  const { data: personsWithInterests } = await supabase
    .from('persons')
    .select('interests')
    .not('interests', 'is', null) as { data: { interests: string[] | null }[] | null };

  const tagMap = new Map<string, number>();
  
  // From person_tags
  (allPersonTags || []).forEach((pt: any) => {
    const tagName = pt.tags?.name;
    if (tagName) {
      tagMap.set(tagName, (tagMap.get(tagName) || 0) + 1);
    }
  });

  // From persons.interests array
  (personsWithInterests || []).forEach(p => {
    if (Array.isArray(p.interests)) {
      p.interests.forEach(interest => {
        tagMap.set(interest, (tagMap.get(interest) || 0) + 1);
      });
    }
  });

  const skillCloud = Array.from(tagMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // 4. Garden Health Aggregate (Calculated from Persons ROI)
  const { data: contacts } = await supabase
    .from('persons')
    .select('last_interaction_date, target_frequency_days, importance')
    .or('archived.eq.false,archived.is.null,archive_status.eq.false,archive_status.is.null') as { data: any[] | null };

  const health = {
    nurtured: 0,
    drifting: 0,
    neglected: 0
  };

  const now = new Date();
  (contacts || []).forEach(contact => {
    const importanceValue = contact.importance || 'medium';
    // Match the ROI algorithm used in dashboardUtils
    const threshold = contact.target_frequency_days || (importanceValue === 'high' ? 14 : importanceValue === 'low' ? 90 : 30);
    
    if (!contact.last_interaction_date) {
      health.neglected++;
      return;
    }

    const lastInteraction = new Date(contact.last_interaction_date);
    const daysSince = Math.floor((now.getTime() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSince <= threshold) {
      health.nurtured++;
    } else if (daysSince <= threshold * 1.5) {
      health.drifting++;
    } else {
      health.neglected++;
    }
  });

  const totalHealth = (health.nurtured + health.drifting + health.neglected) || 1;

  // 5. Mock Data for Bridge Activity & Top Connectors 
  // (Since these tables/concepts are new and need full implementation)
  const bridgeActivity = {
    dates: Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      return d.toISOString().split('T')[0];
    }),
    requests: Array.from({ length: 30 }, () => Math.floor(Math.random() * 20) + 5),
    approvals: Array.from({ length: 30 }, () => Math.floor(Math.random() * 15) + 2)
  };

  const topConnectors = [
    { name: "Alex Rivera", avatar: null, referrals: 24 },
    { name: "Jordan Smith", avatar: null, referrals: 18 },
    { name: "Sarah Chen", avatar: null, referrals: 15 },
    { name: "Marcus Thorne", avatar: null, referrals: 12 },
    { name: "Elena Gilbert", avatar: null, referrals: 9 }
  ];

  return {
    pulseScore: ((activeUsers || 0) / (totalUsers || 1)) * 100,
    referralVelocity: bridgeActivity.approvals.reduce((a, b) => a + b, 0),
    skillCloud,
    networkDensity: density * 100, // as percentage
    gardenHealth: {
      nurtured: (health.nurtured / totalHealth) * 100,
      drifting: (health.drifting / totalHealth) * 100,
      neglected: (health.neglected / totalHealth) * 100
    },
    bridgeActivity,
    topConnectors
  };
}
