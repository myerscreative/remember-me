
import { type Database } from "@/types/database.types";

type Person = Database['public']['Tables']['persons']['Row'];

export interface PotentialDuplicateGroup {
  id: string; // unique ID for the group
  keeper: Person;
  duplicates: Person[];
  score: number;
  reason: string[];
}

// Levenshtein distance for string similarity
function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];

  // increment along the first column of each row
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  // increment each column in the first row
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          )
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

function getSimilarity(s1: string, s2: string): number {
  if (!s1 || !s2) return 0;
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  const longerLength = longer.length;
  if (longerLength === 0) {
    return 1.0;
  }
  return (longerLength - levenshteinDistance(longer, shorter)) / longerLength;
}

export function findPotentialDuplicates(contacts: Person[]): PotentialDuplicateGroup[] {
  const groups: PotentialDuplicateGroup[] = [];
  const processedOrGrouped = new Set<string>();

  // Sort by interaction count (desc) to prefer active contacts as keepers
  const sortedContacts = [...contacts].sort((a, b) => 
    ((b.interaction_count || 0) - (a.interaction_count || 0))
  );

  for (let i = 0; i < sortedContacts.length; i++) {
    const current = sortedContacts[i];
    if (processedOrGrouped.has(current.id)) continue;

    const group: Person[] = [current];
    const reasons: string[] = [];
    let maxScore = 0;

    for (let j = i + 1; j < sortedContacts.length; j++) {
      const other = sortedContacts[j];
      if (processedOrGrouped.has(other.id)) continue;

      let score = 0;
      const currentReasons = [];

      // Email Match (Strongest)
      if (current.email && other.email && current.email.toLowerCase() === other.email.toLowerCase()) {
        score = 1.0;
        currentReasons.push('Exact Email Match');
      }

      // Phone Match (Strong)
      const cleanPhone1 = current.phone?.replace(/\D/g, '');
      const cleanPhone2 = other.phone?.replace(/\D/g, '');
      if (cleanPhone1 && cleanPhone2 && cleanPhone1.length > 6 && cleanPhone1 === cleanPhone2) {
        score = Math.max(score, 1.0);
        currentReasons.push('Exact Phone Match');
      }

      // Name Match (Fuzzy)
      const nameSim = getSimilarity(current.name?.toLowerCase() || '', other.name?.toLowerCase() || '');
      if (nameSim > 0.85) { // High threshold for name similarity
         score = Math.max(score, 0.9);
         currentReasons.push(`Similar Name (${Math.round(nameSim * 100)}%)`);
      }
      
      // First Name + Last Initial Match (e.g. Mindy Brian vs Mindy B)
      // Only if we haven't matched yet
      if (score < 0.8 && current.first_name && other.first_name && 
          current.first_name.toLowerCase() === other.first_name.toLowerCase()) {
            
             const name1parts = current.name.split(' ');
             const name2parts = other.name.split(' ');
             
             // Check if one is just First Name and the other is First + Last
             if ((name1parts.length === 1 && name2parts.length > 1) || 
                 (name2parts.length === 1 && name1parts.length > 1)) {
                   score = Math.max(score, 0.85); // High confidence if first name is exact and one is missing last name
                   currentReasons.push('First Name Match (Missing Last Name)');
             }
             // Check initials
             else if (current.last_name && other.last_name) {
                const ln1 = current.last_name.toLowerCase();
                const ln2 = other.last_name.toLowerCase();
                
                if ((ln1.length === 1 && ln2.startsWith(ln1)) || (ln2.length === 1 && ln1.startsWith(ln2))) {
                    score = Math.max(score, 0.88);
                    currentReasons.push('First Name + Last Initial Match');
                }
             }
      }


      if (score >= 0.85) { // Threshold to consider duplicate
        group.push(other);
        processedOrGrouped.add(other.id);
        maxScore = Math.max(maxScore, score);
        reasons.push(...currentReasons);
      }
    }

    if (group.length > 1) {
      processedOrGrouped.add(current.id);
      
      // Determine Keeper (Logic: Best data quality)
      // We already sorted by interaction count, but maybe check data completeness too
      // For now, index 0 is best because of interaction count sort.
      const keeper = group[0]; 
      const duplicates = group.slice(1);

      groups.push({
        id: `group-${current.id}`,
        keeper,
        duplicates,
        score: maxScore,
        reason: [...new Set(reasons)] // dedupe reasons
      });
    }
  }

  return groups;
}
