'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateFamilyMembers(contactId: string, familyMembers: any[]) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.id) throw new Error("Unauthorized");

    const { error } = await (supabase as any)
      .from('persons')
      .update({ family_members: familyMembers })
      .eq('id', contactId)
      .eq('user_id', user.id);

    if (error) throw error;

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

    revalidatePath(`/contacts/${contactId}`);
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error adding family member:", error);
    return { success: false, error: message };
  }
}
