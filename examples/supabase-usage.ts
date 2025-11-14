// Example usage of Supabase with ReMember Me database schema
// This file demonstrates how to interact with the database

import { createClient } from "@/lib/supabase/client";
import type { Person, PersonInsert, Tag, Interaction } from "@/lib/supabase/types";

// ============================================
// 1. BASIC CRUD OPERATIONS
// ============================================

// CREATE: Add a new person
export async function addPerson(personData: PersonInsert) {
  const supabase = ( createClient()) as any;
  
  const { data, error } = await (supabase as any)
    .from("persons")
    .insert(personData)
    .select()
    .single();

  if (error) throw error;
  return data as Person;
}

// READ: Get all persons for current user
export async function getPersons() {
  const supabase = ( createClient()) as any;
  
  const { data, error } = await (supabase as any)
    .from("persons")
    .select("*")
    .order("name");

  if (error) throw error;
  return data as Person[];
}

// READ: Get single person with their tags
export async function getPersonWithTags(personId: string) {
  const supabase = ( createClient()) as any;
  
  const { data, error } = await (supabase as any)
    .from("persons")
    .select(`
      *,
      person_tags (
        tag_id,
        tags (*)
      )
    `)
    .eq("id", personId)
    .single();

  if (error) throw error;
  return data;
}

// UPDATE: Update person information
export async function updatePerson(personId: string, updates: Partial<PersonInsert>) {
  const supabase = ( createClient()) as any;
  
  const { data, error } = await (supabase as any)
    .from("persons")
    .update(updates)
    .eq("id", personId)
    .select()
    .single();

  if (error) throw error;
  return data as Person;
}

// DELETE: Remove a person
export async function deletePerson(personId: string) {
  const supabase = ( createClient()) as any;
  
  const { error } = await (supabase as any)
    .from("persons")
    .delete()
    .eq("id", personId);

  if (error) throw error;
}

// ============================================
// 2. TAGS MANAGEMENT
// ============================================

// Get all tags for current user
export async function getTags() {
  const supabase = ( createClient()) as any;
  
  const { data, error } = await (supabase as any)
    .from("tags")
    .select("*")
    .order("name");

  if (error) throw error;
  return data as Tag[];
}

// Create a new tag
export async function createTag(name: string, color: string = "#8b5cf6") {
  const supabase = ( createClient()) as any;
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await (supabase as any)
    .from("tags")
    .insert({ user_id: user.id, name, color })
    .select()
    .single();

  if (error) throw error;
  return data as Tag;
}

// Add tag to person
export async function addTagToPerson(personId: string, tagId: string) {
  const supabase = ( createClient()) as any;
  
  const { error } = await (supabase as any)
    .from("person_tags")
    .insert({ person_id: personId, tag_id: tagId });

  if (error) throw error;
}

// Remove tag from person
export async function removeTagFromPerson(personId: string, tagId: string) {
  const supabase = ( createClient()) as any;
  
  const { error } = await (supabase as any)
    .from("person_tags")
    .delete()
    .eq("person_id", personId)
    .eq("tag_id", tagId);

  if (error) throw error;
}

// ============================================
// 3. INTERACTIONS
// ============================================

// Log a new interaction
export async function logInteraction(
  personId: string,
  interactionType: 'meeting' | 'call' | 'email' | 'message' | 'other',
  title?: string,
  notes?: string
) {
  const supabase = ( createClient()) as any;
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await (supabase as any)
    .from("interactions")
    .insert({
      user_id: user.id,
      person_id: personId,
      interaction_type: interactionType,
      title,
      notes,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Interaction;
}

// Get all interactions for a person
export async function getPersonInteractions(personId: string) {
  const supabase = ( createClient()) as any;
  
  const { data, error } = await (supabase as any)
    .from("interactions")
    .select("*")
    .eq("person_id", personId)
    .order("interaction_date", { ascending: false });

  if (error) throw error;
  return data as Interaction[];
}

// ============================================
// 4. SEARCH & FILTERS
// ============================================

// Full-text search using the database function
export async function searchPersons(query: string) {
  const supabase = ( createClient()) as any;
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await (supabase as any)
    .rpc("search_persons", {
      search_query: query,
      current_user_id: user.id,
    });

  if (error) throw error;
  return data as Person[];
}

// Filter persons by tag
export async function getPersonsByTag(tagId: string) {
  const supabase = ( createClient()) as any;
  
  const { data, error } = await (supabase as any)
    .from("persons")
    .select(`
      *,
      person_tags!inner (
        tag_id
      )
    `)
    .eq("person_tags.tag_id", tagId)
    .order("name");

  if (error) throw error;
  return data as Person[];
}

// Get persons who need follow-up
export async function getFollowUpReminders() {
  const supabase = ( createClient()) as any;
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await (supabase as any)
    .rpc("get_follow_up_reminders", {
      current_user_id: user.id,
    });

  if (error) throw error;
  return data as Person[];
}

// Get persons not contacted recently
export async function getStaleContacts(daysAgo: number = 30) {
  const supabase = ( createClient()) as any;
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysAgo);

  const { data, error } = await (supabase as any)
    .from("persons")
    .select("*")
    .or(`last_contact.is.null,last_contact.lt.${cutoffDate.toISOString()}`)
    .order("last_contact", { ascending: true, nullsFirst: false });

  if (error) throw error;
  return data as Person[];
}

// ============================================
// 5. RELATIONSHIPS
// ============================================

// Create a relationship between two persons
export async function createRelationship(
  fromPersonId: string,
  toPersonId: string,
  relationshipType: string,
  context?: string
) {
  const supabase = ( createClient()) as any;
  
  const { data, error } = await (supabase as any)
    .from("relationships")
    .insert({
      from_person_id: fromPersonId,
      to_person_id: toPersonId,
      relationship_type: relationshipType,
      context,
      direction: "bidirectional",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Get all relationships for a person
export async function getPersonRelationships(personId: string) {
  const supabase = ( createClient()) as any;
  
  const { data, error } = await (supabase as any)
    .from("relationships")
    .select(`
      *,
      from_person:persons!relationships_from_person_id_fkey (*),
      to_person:persons!relationships_to_person_id_fkey (*)
    `)
    .or(`from_person_id.eq.${personId},to_person_id.eq.${personId}`);

  if (error) throw error;
  return data;
}

// ============================================
// 6. VIEWS - PRE-AGGREGATED DATA
// ============================================

// Get persons with their tags (using the view)
export async function getPersonsWithTags() {
  const supabase = ( createClient()) as any;
  
  const { data, error } = await (supabase as any)
    .from("persons_with_tags")
    .select("*")
    .order("name");

  if (error) throw error;
  return data;
}

// Get interaction counts per person (using the view)
export async function getInteractionCounts() {
  const supabase = ( createClient()) as any;
  
  const { data, error } = await (supabase as any)
    .from("person_interaction_counts")
    .select("*")
    .order("total_interactions", { ascending: false });

  if (error) throw error;
  return data;
}

// ============================================
// 7. FILE UPLOADS (Attachments)
// ============================================

// Upload a file to Supabase Storage
export async function uploadAttachment(
  file: File,
  personId: string,
  attachmentType: 'voice_note' | 'document' | 'image' | 'other'
) {
  const supabase = ( createClient()) as any;
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Upload file to storage
  const filePath = `${user.id}/${personId}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await (supabase as any)
    .storage
    .from("attachments")
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  // Get public URL
  const { data: { publicUrl } } = (supabase as any)
    .storage
    .from("attachments")
    .getPublicUrl(filePath);

  // Create attachment record
  const { data, error } = await (supabase as any)
    .from("attachments")
    .insert({
      user_id: user.id,
      person_id: personId,
      file_name: file.name,
      file_url: publicUrl,
      file_type: file.type,
      file_size: file.size,
      attachment_type: attachmentType,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Get all attachments for a person
export async function getPersonAttachments(personId: string) {
  const supabase = ( createClient()) as any;
  
  const { data, error } = await (supabase as any)
    .from("attachments")
    .select("*")
    .eq("person_id", personId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

// ============================================
// 8. REAL-TIME SUBSCRIPTIONS
// ============================================

// Subscribe to changes in persons table
export function subscribeToPersons(callback: (person: Person) => void) {
  const supabase = ( createClient()) as any;
  
  const channel = (supabase as any)
    .channel("persons-changes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "persons",
      },
      (payload) => {
        callback(payload.new as Person);
      }
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel);
  };
}

// ============================================
// EXAMPLE USAGE IN A COMPONENT
// ============================================

/*
'use client';

import { useEffect, useState } from 'react';
import { getPersons, searchPersons, addPerson } from '@/examples/supabase-usage';
import type { Person } from '@/lib/supabase/types';

export default function ContactsPage() {
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPersons();
  }, []);

  async function loadPersons() {
    try {
      const data = await getPersons();
      setPersons(data);
    } catch (error) {
      console.error('Error loading persons:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddPerson(name: string, email: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const newPerson = await addPerson({
      user_id: user.id,
      name,
      email,
    });

    setPersons([...persons, newPerson]);
  }

  async function handleSearch(query: string) {
    const results = await searchPersons(query);
    setPersons(results);
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {persons.map(person => (
        <div key={person.id}>
          <h3>{person.name}</h3>
          <p>{person.email}</p>
        </div>
      ))}
    </div>
  );
}
*/

