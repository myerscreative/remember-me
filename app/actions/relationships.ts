'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { 
  RelationshipRole, 
  InterContactRelationship, 
  LinkedContact 
} from '@/types/database.types';
import { getInverseRelationship } from '@/lib/relationship-utils';

/**
 * Get all relationships for a contact, with linked person data and health info
 */
export async function getRelationshipsForContact(contactId: string): Promise<{
  success: boolean;
  relationships: LinkedContact[];
  error?: string;
}> {
  const supabase = await createClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { success: false, relationships: [], error: 'Not authenticated' };
  }

  try {
    // Get relationships where this contact is either A or B
    // Note: Cast to any because inter_contact_relationships table
    // not in generated types until migration runs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: relData, error: relError } = await (supabase as any)
      .from('inter_contact_relationships')
      .select('*')
      .eq('user_id', user.id)
      .or(`contact_id_a.eq.${contactId},contact_id_b.eq.${contactId}`);

    if (relError) {
      console.error('Error fetching relationships:', relError);
      return { success: false, relationships: [], error: relError.message };
    }

    if (!relData || relData.length === 0) {
      return { success: true, relationships: [] };
    }

    // Get all linked contact IDs
    const linkedIds = relData.map(r => 
      r.contact_id_a === contactId ? r.contact_id_b : r.contact_id_a
    );

    // Fetch linked contact data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: contacts, error: contactsError } = await (supabase as any)
      .from('persons')
      .select('id, name, first_name, last_name, photo_url, last_interaction_date, importance')
      .in('id', linkedIds);

    if (contactsError) {
      console.error('Error fetching linked contacts:', contactsError);
      return { success: false, relationships: [], error: contactsError.message };
    }

    // Build linked contacts with health data
    const linkedContacts: LinkedContact[] = relData.map(rel => {
      const isInverse = rel.contact_id_b === contactId;
      const linkedContactId = isInverse ? rel.contact_id_a : rel.contact_id_b;
      const person = contacts?.find(c => c.id === linkedContactId);

      // Default target frequency based on importance
      let targetFrequency = 30;
      if (person?.importance === 'high') targetFrequency = 14;
      if (person?.importance === 'low') targetFrequency = 90;

      return {
        id: linkedContactId,
        name: person?.name || 'Unknown',
        first_name: person?.first_name || '',
        last_name: person?.last_name || null,
        photo_url: person?.photo_url || null,
        relationship_id: rel.id,
        relationship_type: isInverse 
          ? getInverseRelationship(rel.relationship_type as RelationshipRole)
          : rel.relationship_type as RelationshipRole,
        is_inverse: isInverse,
        last_interaction_date: person?.last_interaction_date || null,
        target_frequency_days: targetFrequency,
      };
    });

    return { success: true, relationships: linkedContacts };
  } catch (err) {
    console.error('Error in getRelationshipsForContact:', err);
    return { success: false, relationships: [], error: 'Unexpected error' };
  }
}

/**
 * Create a new relationship between two contacts
 */
export async function createRelationship(
  contactIdA: string,
  contactIdB: string,
  relationshipType: RelationshipRole,
  notes?: string
): Promise<{ success: boolean; relationship?: InterContactRelationship; error?: string }> {
  const supabase = await createClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    // Check if relationship already exists (in either direction)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase as any)
      .from('inter_contact_relationships')
      .select('id')
      .eq('user_id', user.id)
      .or(`and(contact_id_a.eq.${contactIdA},contact_id_b.eq.${contactIdB}),and(contact_id_a.eq.${contactIdB},contact_id_b.eq.${contactIdA})`)
      .maybeSingle();

    if (existing) {
      return { success: false, error: 'Relationship already exists between these contacts' };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('inter_contact_relationships')
      .insert({
        user_id: user.id,
        contact_id_a: contactIdA,
        contact_id_b: contactIdB,
        relationship_type: relationshipType,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating relationship:', error);
      return { success: false, error: error.message };
    }

    revalidatePath(`/contacts/${contactIdA}`);
    revalidatePath(`/contacts/${contactIdB}`);

    return { success: true, relationship: data as InterContactRelationship };
  } catch (err) {
    console.error('Error in createRelationship:', err);
    return { success: false, error: 'Unexpected error' };
  }
}

/**
 * Delete a relationship
 */
export async function deleteRelationship(relationshipId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    // Get the relationship first to know which contacts to revalidate
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rel } = await (supabase as any)
      .from('inter_contact_relationships')
      .select('contact_id_a, contact_id_b')
      .eq('id', relationshipId)
      .eq('user_id', user.id)
      .single();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('inter_contact_relationships')
      .delete()
      .eq('id', relationshipId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting relationship:', error);
      return { success: false, error: error.message };
    }

    if (rel) {
      revalidatePath(`/contacts/${rel.contact_id_a}`);
      revalidatePath(`/contacts/${rel.contact_id_b}`);
    }

    return { success: true };
  } catch (err) {
    console.error('Error in deleteRelationship:', err);
    return { success: false, error: 'Unexpected error' };
  }
}

/**
 * Search contacts for linking (excludes current contact and already linked)
 */
export async function searchContactsForLinking(
  currentContactId: string,
  query: string
): Promise<{ success: boolean; contacts: Array<{ id: string; name: string; photo_url: string | null }>; error?: string }> {
  const supabase = await createClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { success: false, contacts: [], error: 'Not authenticated' };
  }

  try {
    // Get already linked contact IDs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingRels } = await (supabase as any)
      .from('inter_contact_relationships')
      .select('contact_id_a, contact_id_b')
      .eq('user_id', user.id)
      .or(`contact_id_a.eq.${currentContactId},contact_id_b.eq.${currentContactId}`);

    const linkedIds = new Set<string>([currentContactId]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    existingRels?.forEach((rel: any) => {
      linkedIds.add(rel.contact_id_a);
      linkedIds.add(rel.contact_id_b);
    });

    // Search for contacts matching query, excluding already linked
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: contacts, error } = await (supabase as any)
      .from('persons')
      .select('id, name, photo_url')
      .eq('user_id', user.id)
      .eq('archived', false)
      .ilike('name', `%${query}%`)
      .limit(10);

    if (error) {
      return { success: false, contacts: [], error: error.message };
    }

    // Filter out already linked contacts
    const filteredContacts = (contacts || []).filter(c => !linkedIds.has(c.id));

    return { success: true, contacts: filteredContacts };
  } catch (err) {
    console.error('Error in searchContactsForLinking:', err);
    return { success: false, contacts: [], error: 'Unexpected error' };
  }
}
