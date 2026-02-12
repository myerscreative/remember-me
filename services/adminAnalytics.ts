'use server';

import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

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
  totalUsers: number;
  activeUsers: number;
}

interface Connector {
  name: string;
  avatar: string | null;
  referrals: number;
}

/**
 * Aggregates community-wide data for the Admin Dashboard.
 * All data is anonymized/aggregated to respect privacy where possible.
 */
export async function getCommunityVitalSigns(): Promise<CommunityVitalSigns> {
  // Default values to prevent dashboard crash
  const emptySigns: CommunityVitalSigns = {
    pulseScore: 0,
    referralVelocity: 0,
    skillCloud: [],
    networkDensity: 0,
    gardenHealth: { nurtured: 0, drifting: 0, neglected: 0 },
    bridgeActivity: { dates: [], requests: [], approvals: [] },
    topConnectors: [],
    totalUsers: 0,
    activeUsers: 0
  };

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Admin Analytics: Missing Supabase environment variables');
      return emptySigns;
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

  const { count: totalUsers } = await supabase
    .from('user_stats')
    .select('*', { count: 'exact' });

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count: activeUsers } = await supabase
    .from('user_stats')
    .select('*', { count: 'exact' })
    .gte('last_activity_date', sevenDaysAgo);

  // 2. Network Density (Based on total persons in the database)
  const { count: totalPersons } = await supabase
    .from('persons')
    .select('*', { count: 'exact' });

  const { count: actualConnections } = await supabase
    .from('relationships')
    .select('*', { count: 'exact' });

  const n = totalPersons || 1;
  const potentialConnections = (n * (n - 1)) / 2 || 1;
  const density = (actualConnections || 0) / potentialConnections;

  // 3. Aggregate Top Skills (Top 10 tags/interests across the group)
  const { data: allPersonTags } = await supabase
    .from('person_tags')
    .select('tag_id, tags(name)') as { data: any[] | null };
  
  const { data: personsWithInterests } = await supabase
    .from('persons')
    .select('interests')
    .not('interests', 'is', null) as { data: any[] | null };

  const tagMap = new Map<string, number>();
  
  // From person_tags
  (allPersonTags || []).forEach((pt: any) => {
    const tagName = pt.tags?.name;
    if (tagName) {
      tagMap.set(tagName, (tagMap.get(tagName) || 0) + 1);
    }
  });

  // From persons.interests array
  (personsWithInterests || []).forEach((p: any) => {
    if (Array.isArray(p.interests)) {
      p.interests.forEach((interest: string) => {
        tagMap.set(interest, (tagMap.get(interest) || 0) + 1);
      });
    }
  });

  const skillCloud = Array.from(tagMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // 4. Garden Health Aggregate
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
  (contacts || []).forEach((contact: any) => {
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

  // 5. Bridge Velocity (Real Data: Returns last 30 days)
  // "Requests" -> New Contacts Added
  // "Approvals" -> Interactions Logged
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysStr = thirtyDaysAgo.toISOString();

  const { data: newContacts } = await supabase
    .from('persons')
    .select('created_at')
    .gte('created_at', thirtyDaysStr) as { data: any[] | null };

  const { data: recentInteractions } = await supabase
    .from('interactions')
    .select('date')
    .gte('date', thirtyDaysStr) as { data: any[] | null };

  const dateBuckets = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().split('T')[0];
  });

  const requestsMap = new Map<string, number>();
  (newContacts || []).forEach((c: any) => {
    if (c.created_at) {
        const d = c.created_at.split('T')[0];
        requestsMap.set(d, (requestsMap.get(d) || 0) + 1);
    }
  });

  const approvalsMap = new Map<string, number>();
  (recentInteractions || []).forEach((i: any) => {
    if (i.date) {
        const d = i.date.split('T')[0];
        approvalsMap.set(d, (approvalsMap.get(d) || 0) + 1);
    }
  });

  const bridgeActivity = {
    dates: dateBuckets,
    requests: dateBuckets.map(d => requestsMap.get(d) || 0),
    approvals: dateBuckets.map(d => approvalsMap.get(d) || 0)
  };

  // 6. Top Connectors (Real Data: Users with most total contacts)
  const { data: topUsers } = await supabase
    .from('user_stats')
    .select('user_id, total_contacts')
    .order('total_contacts', { ascending: false })
    .limit(5) as { data: any[] | null };

  let topConnectors: Connector[] = [];

  if (topUsers && topUsers.length > 0) {
    // Attempt to fetch real user details
    const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();
    
    if (!authError && authUsers) {
        // Map any[] to avoid strict type issues with AuthUser
        const userMap = new Map(authUsers.map((u: any) => [u.id, u] as [string, any]));
        
        topConnectors = topUsers.map((stat: any) => {
            const user = userMap.get(stat.user_id);
            const name = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || `User ${stat.user_id.substring(0,4)}`;
            const avatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;
            
            return {
                name,
                avatar,
                referrals: stat.total_contacts || 0
            };
        });
    } else {
        topConnectors = topUsers.map((stat: any) => ({
            name: `User ${stat.user_id.substring(0,4)}...`,
            avatar: null,
            referrals: stat.total_contacts || 0
        }));
    }
  }

    return {
      pulseScore: ((activeUsers || 0) / (totalUsers || 1)) * 100,
      referralVelocity: bridgeActivity.approvals.reduce((a, b) => a + b, 0),
      skillCloud,
      networkDensity: Math.min(100, (density * 100) * 10), // Multiplied by 10 for visibility of sparse networks
      gardenHealth: {
        nurtured: (health.nurtured / totalHealth) * 100,
        drifting: (health.drifting / totalHealth) * 100,
        neglected: (health.neglected / totalHealth) * 100
      },
      bridgeActivity,
      topConnectors,
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers || 0
    };
  } catch (error) {
    console.error('Admin Analytics Error:', error);
    // Return empty state rather than throwing 500
    return emptySigns;
  }
}
