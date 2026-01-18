'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateFamilyMembers(contactId: string, familyMembers: any[]) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.id) throw new Error("Unauthorized");

    // Deduplicate family members by name (case-insensitive)
    const deduplicatedMembers: any[] = [];
    const seenNames = new Set<string>();
    
    for (const member of familyMembers) {
      const nameLower = member.name?.toLowerCase();
      if (nameLower && !seenNames.has(nameLower)) {
        deduplicatedMembers.push(member);
        seenNames.add(nameLower);
      }
    }

    const { error } = await (supabase as any)
      .from('persons')
      .update({ family_members: deduplicatedMembers })
      .eq('id', contactId)
      .eq('user_id', user.id);

    if (error) throw error;

    // Auto-trigger AI summary refresh when family members change
    try {
      const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      fetch(`${origin}/api/refresh-ai-summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId }),
      }).catch(err => console.error('Background AI refresh failed:', err));
    } catch (refreshError) {
      console.log('Could not trigger background AI refresh');
    }

    revalidatePath(`/contacts/${contactId}`);
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error updating family members:", error);
    return { success: false, error: message };
  }
  }


export async function addFamilyMember(contactId: string, member: any) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.id) throw new Error("Unauthorized");

    // Fetch current family members
    const { data: contact, error: fetchError } = await (supabase as any)
      .from('persons')
      .select('family_members')
      .eq('id', contactId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !contact) throw fetchError || new Error("Contact not found");

    const currentMembers = Array.isArray(contact.family_members) ? contact.family_members : [];
    const newMembers = [...currentMembers, member];

    const { error: updateError } = await (supabase as any)
      .from('persons')
      .update({ family_members: newMembers })
      .eq('id', contactId)
      .eq('user_id', user.id);

    if (updateError) throw updateError;

    // Auto-trigger AI summary refresh when family members change
    try {
      const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      fetch(`${origin}/api/refresh-ai-summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId }),
      }).catch(err => console.error('Background AI refresh failed:', err));
    } catch (refreshError) {
      console.log('Could not trigger background AI refresh');
    }

    revalidatePath(`/contacts/${contactId}`);
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error adding family member:", error);
    return { success: false, error: message };
  }
}
