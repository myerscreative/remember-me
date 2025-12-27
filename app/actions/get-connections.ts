"use server";

import { createClient } from "@/lib/supabase/server";
import { Person } from "@/types/database.types";

export interface ConnectionWithDetails {
  id: string;
  contact_id_a: string;
  contact_id_b: string;
  relationship_type: string;
  notes: string | null;
  created_at: string;
  connected_person: Person;
}

export async function getConnections(personId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };

  try {
    // Fetch connections where person is A or B
    const { data, error } = await (supabase as any)
      .from("inter_contact_relationships")
      .select("*")
      .or(`contact_id_a.eq.${personId},contact_id_b.eq.${personId}`)
      .limit(20);

    if (error) throw error;
    if (!data) return { success: true, data: [] };

    // Get the IDs of the OTHER people
    const otherPersonIds = data.map((rel: any) => 
      rel.contact_id_a === personId ? rel.contact_id_b : rel.contact_id_a
    );

    // Fetch details for those people
    const { data: persons, error: personError } = await (supabase as any)
      .from("persons")
      .select("*")
      .in("id", otherPersonIds);

    if (personError) throw personError;

    // Merge details
    const connectionsWithDetails: ConnectionWithDetails[] = data.map((rel: any) => {
      const otherId = rel.contact_id_a === personId ? rel.contact_id_b : rel.contact_id_a;
      const person = persons?.find((p: any) => p.id === otherId);
      return {
        ...rel,
        connected_person: person!
      };
    }).filter((c: any) => c.connected_person); // Filter out any missing persons

    return { success: true, data: connectionsWithDetails };
  } catch (error) {
    console.error("Error fetching connections:", error);
    return { success: false, error: "Failed to fetch connections" };
  }
}
