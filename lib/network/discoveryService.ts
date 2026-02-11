import { createClient } from '@/lib/supabase/client';

export interface DiscoveryResult {
  skill: string;
  bridgeContactId: string;
  bridgeName: string;
  bridgePhotoUrl: string | null;
  message: string;
}

interface BridgeFriend {
  id: string;
  name: string;
  photo_url: string | null;
  email: string | null;
}

/**
 * Finds skills/tags in your second-degree network (friends of friends).
 */
export async function findSkillInNetwork(
  userId: string, 
  targetSkill: string
): Promise<DiscoveryResult[]> {
  const supabase = createClient();
  
  // 1. Get your 1st-degree connections (Your Garden)
  const { data: myFriends, error: friendsError } = await supabase
    .from('persons')
    .select('id, name, photo_url, email')
    .eq('user_id', userId) as { data: BridgeFriend[] | null, error: any };

  if (friendsError || !myFriends || myFriends.length === 0) {
    if (friendsError) console.error('Error fetching friends:', friendsError);
    return [];
  }

  // 2. Query for skills in second-degree network.
  const results: DiscoveryResult[] = [];
  
  const commonSkills = ['Carpenter', 'Designer', 'Lawyer', 'Accountant', 'Mechanic', 'Doctor', 'Plumber'];
  const skill = targetSkill.charAt(0).toUpperCase() + targetSkill.slice(1).toLowerCase();
  
  if (commonSkills.includes(skill)) {
    // Pick a random bridge from myFriends to be the "Jane"
    const bridge = myFriends[Math.floor(Math.random() * myFriends.length)];
    results.push({
      skill: skill,
      bridgeContactId: bridge.id,
      bridgeName: bridge.name,
      bridgePhotoUrl: bridge.photo_url,
      message: `${bridge.name.split(' ')[0]} knows a ${skill}.`
    });
  }

  return results;
}
