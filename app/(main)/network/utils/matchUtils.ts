import { Contact } from '../mockContacts';

export type MatchLevel = 'strong' | 'medium' | 'none' | 'selected';

export interface MatchResult {
  level: MatchLevel;
  sharedInterests: string[];
  count: number;
}

export function calculateMatchScore(selected: Contact, other: Contact): MatchResult {
  if (selected.id === other.id) {
    return { level: 'selected', sharedInterests: [], count: 0 };
  }

  const sharedInterests = selected.interests.filter(i => 
    other.interests.some(oi => oi.toLowerCase() === i.toLowerCase())
  );
  
  const count = sharedInterests.length;
  let level: MatchLevel = 'none';
  
  if (count >= 2) {
    level = 'strong';
  } else if (count === 1) {
    level = 'medium';
  }

  return { level, sharedInterests, count };
}
