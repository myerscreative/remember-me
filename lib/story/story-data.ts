import { createClient } from '@/lib/supabase/client';

export interface ContactFact {
  id: string;
  contact_id: string;
  category: 'career' | 'family' | 'interest' | 'goal' | 'general';
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Interaction {
  id: string;
  person_id: string;
  user_id: string;
  interaction_type: string;  // Database column name
  interaction_date: string;  // Database column name
  notes: string | null;
  created_at: string;
}

export interface TimelineItem {
  id: string;
  type: 'interaction' | 'fact';
  date: string;
  category?: string;
  interactionType?: string;
  content: string;
  note?: string | null;
}

/**
 * Fetch all facts for a contact
 */
export async function getContactFacts(contactId: string): Promise<ContactFact[]> {
  const supabase = createClient();
  
  // Note: Type assertion needed until contact_facts table is created via migration
  const { data, error } = await (supabase as ReturnType<typeof createClient>)
    .from('contact_facts' as 'persons')
    .select('*')
    .eq('contact_id' as 'id', contactId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching facts:', error);
    return [];
  }

  return (data as unknown as ContactFact[]) || [];
}

/**
 * Fetch all interactions for a contact
 */
export async function getContactInteractions(contactId: string): Promise<Interaction[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('interactions')
    .select('*')
    .eq('person_id', contactId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching interactions:', error);
    return [];
  }

  return data || [];
}

/**
 * Get a combined, chronologically sorted timeline of interactions and facts
 */
export async function getStoryTimeline(contactId: string): Promise<TimelineItem[]> {
  const [facts, interactions] = await Promise.all([
    getContactFacts(contactId),
    getContactInteractions(contactId)
  ]);

  const timelineItems: TimelineItem[] = [];

  // Add facts to timeline
  for (const fact of facts) {
    timelineItems.push({
      id: fact.id,
      type: 'fact',
      date: fact.created_at,
      category: fact.category,
      content: fact.content,
    });
  }

  // Add interactions to timeline
  for (const interaction of interactions) {
    // Map database types back to app types for display
    const appType = mapDbTypeToAppType(interaction.interaction_type);
    timelineItems.push({
      id: interaction.id,
      type: 'interaction',
      date: interaction.interaction_date || interaction.created_at,
      interactionType: appType,
      content: getInteractionLabel(appType),
      note: interaction.notes,
    });
  }

  // Sort by date descending (newest first)
  timelineItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return timelineItems;
}

function mapDbTypeToAppType(dbType: string): string {
  // Map database types back to app types
  const mapping: Record<string, string> = {
    'meeting': 'in-person',
    'call': 'call',
    'email': 'email',
    'message': 'text',  // Map 'message' back to 'text'
    'other': 'other',
  };
  return mapping[dbType] || dbType;
}

function getInteractionLabel(type: string): string {
  const labels: Record<string, string> = {
    'call': 'Phone call',
    'text': 'Text message',
    'email': 'Email',
    'in-person': 'Met in person',
    'social': 'Social media interaction',
    'other': 'Other interaction',
  };
  return labels[type] || 'Interaction';
}
