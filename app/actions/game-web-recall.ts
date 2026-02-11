'use server';

import { createClient } from '@/lib/supabase/server';
import { RelationshipRole } from '@/types/database.types';

export interface WebRecallQuestion {
  id: string;
  contactA: {
    id: string;
    name: string;
    firstName: string;
    photoUrl: string | null;
  };
  contactB: {
    id: string;
    name: string;
    firstName: string;
    photoUrl: string | null;
  };
  correctAnswer: string;
  options: string[];
  reward: {
    xp: number;
    gardenHealth: number;
  };
}

export async function generateWebRecallQuestions(limit: number = 10): Promise<{
  success: boolean;
  questions: WebRecallQuestion[];
  error?: string;
}> {
  const supabase = await createClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { success: false, questions: [], error: 'Not authenticated' };
  }

  try {
    // 1. Fetch relationships
    const { data: relData, error: relError } = await (supabase as any)
      .from('inter_contact_relationships')
      .select('*')
      .eq('user_id', user.id);

    if (relError) {
      console.error('Error fetching relationships:', relError);
      return { success: false, questions: [], error: relError.message };
    }

    if (!relData || relData.length === 0) {
      return { success: true, questions: [] };
    }

    // 2. Get all involved contact IDs
    const contactIds = new Set<string>();
    relData.forEach((rel: any) => {
      contactIds.add(rel.contact_id_a);
      contactIds.add(rel.contact_id_b);
    });

    // 3. Fetch contact details
    const { data: contacts, error: contactsError } = await (supabase as any)
      .from('persons')
      .select('id, name, first_name, photo_url')
      .in('id', Array.from(contactIds));

    if (contactsError) {
      return { success: false, questions: [], error: contactsError.message };
    }

    const contactMap = new Map(contacts?.map(c => [c.id, c]));

    // 4. Transform into questions
    const allQuestions: WebRecallQuestion[] = relData
      .map((rel: any) => {
        const charA = contactMap.get(rel.contact_id_a) as any;
        const charB = contactMap.get(rel.contact_id_b) as any;

        if (!charA || !charB) return null;

        const relationship = rel.relationship_type as RelationshipRole;
        
        // Accurate relationship string
        const actualAnswer = getFormattedRelationship(charA.first_name, charB.first_name, relationship);

        // Distractors
        const distractors = shuffle([
          "They met at a conference",
          "Former colleagues",
          "Childhood friends",
          "Met through work",
          "They are cousins",
          "Met at a party"
        ]).filter(d => d !== actualAnswer).slice(0, 3);

        const options = shuffle([actualAnswer, ...distractors]);

        return {
          id: rel.id,
          contactA: {
            id: charA.id,
            name: charA.name,
            firstName: charA.first_name,
            photoUrl: charA.photo_url || null,
          },
          contactB: {
            id: charB.id,
            name: charB.name,
            firstName: charB.first_name,
            photoUrl: charB.photo_url || null,
          },
          correctAnswer: actualAnswer,
          options,
          reward: { xp: 30, gardenHealth: 10 }
        };
      })
      .filter(q => q !== null) as WebRecallQuestion[];

    return { 
      success: true, 
      questions: shuffle(allQuestions).slice(0, limit) 
    };
  } catch (err) {
    console.error('Error in generateWebRecallQuestions:', err);
    return { success: false, questions: [], error: 'Unexpected error' };
  }
}

function getFormattedRelationship(nameA: string, nameB: string, type: string): string {
  switch (type) {
    case 'parent': return `${nameA} is ${nameB}'s parent`;
    case 'child': return `${nameB} is ${nameA}'s parent`; // if A is child of B
    case 'spouse': return "They are married";
    case 'partner': return "They are partners";
    case 'sibling': return "They are siblings";
    case 'friend': return "They are friends";
    case 'colleague': return "They are colleagues";
    case 'other': return "They have a shared connection";
    default: return `They are ${type}s`;
  }
}

function shuffle<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}
