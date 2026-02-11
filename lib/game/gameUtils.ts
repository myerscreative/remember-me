// lib/game/gameUtils.ts

import { createClient } from "@/lib/supabase/server";
import { CalendarEvent } from "@/types/game";
import { BasePerson } from "@/types/database.types";

export type MatchedContact = Pick<BasePerson, 'id' | 'name' | 'first_name' | 'last_interaction_date' | 'importance' | 'target_frequency_days'>;

/**
 * Logic to generate an Event Prep session
 * Pulls attendees from a calendar event and matches them to ReMember Me contacts
 */
export async function generateEventPrep(event: CalendarEvent) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // 1. Find contacts in our DB that match the attendee emails
  const { data: matchedContacts, error } = await supabase
    .from('persons')
    .select('id, name, first_name, last_interaction_date, importance, target_frequency_days')
    .eq('user_id', user.id)
    .in('email', event.attendeeEmails);

  if (error || !matchedContacts || matchedContacts.length === 0) return null;

  // 2. Prioritize "Drifting" or "Neglected" contacts for the quiz
  // We'll sort by how long it's been since the last interaction
  const sortedContacts = [...(matchedContacts as MatchedContact[])].sort((a, b) => {
    const dateA = a.last_interaction_date ? new Date(a.last_interaction_date).getTime() : 0;
    const dateB = b.last_interaction_date ? new Date(b.last_interaction_date).getTime() : 0;
    // We want the ones with OLDEST interaction (or no interaction) first for prep
    return dateA - dateB;
  });

  return {
    mode: 'Event Prep',
    title: `Prep for ${event.title}`,
    description: `You're seeing ${matchedContacts.length} people soon. Let's refresh your memory.`,
    contacts: sortedContacts.map(c => c.id),
    rewardXP: matchedContacts.length * 20
  };
}

/**
 * Get fact type for a contact to use in Flashcard
 */
export function getRecommendedFactType(contact: MatchedContact): string {
  // Determine which area of their life needs prep based on data availability
  if (!contact.last_interaction_date) return 'LastMet';
  if (!contact.importance) return 'Bio';
  
  const priorities = ['Bio', 'LastMet', 'Interests', 'Family'];
  // Return random for now if basic data exists
  return priorities[Math.floor(Math.random() * priorities.length)];
}
