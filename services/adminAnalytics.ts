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

  // 3. Aggregate Top Skills (Top 5 tags across the group)
  const { data: tagCounts } = await supabase
    .from('tags')
    .select(`
      name,
      person_tags (count)
    `);

  // Manual aggregation since Supabase client doesn't support complex groupBy easily
  const skillCloud = (tagCounts || [])
    .map((t: any) => ({
      name: t.name,
      count: t.person_tags?.[0]?.count || 0
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // 4. Garden Health Aggregate
  const { data: healthData } = await supabase
    .from('person_health_status')
    .select('current_health');

  const health = {
    nurtured: 0,
    drifting: 0,
    neglected: 0
  };

  (healthData as { current_health: string }[] | null)?.forEach(row => {
    if (row.current_health === 'nurtured') health.nurtured++;
    if (row.current_health === 'drifting') health.drifting++;
    if (row.current_health === 'neglected') health.neglected++;
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
