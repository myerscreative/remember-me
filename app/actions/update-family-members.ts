'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

import { z } from "zod";

// ✅ SECURITY: Validation schemas for family members
const familyMemberSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name too long"),
  relationship: z.string().trim().max(100, "Relationship too long").optional(),
  birthday: z.string().optional().nullable(),
  hobbies: z.string().trim().max(500, "Hobbies too long").optional().nullable(),
  interests: z.string().trim().max(500, "Interests too long").optional().nullable(),
});

const updateFamilyMembersSchema = z.object({
  contactId: z.string().uuid("Invalid contact ID format"),
  familyMembers: z.array(familyMemberSchema).max(50, "Too many family members"),
});

export async function updateFamilyMembers(contactId: string, familyMembers: any[]) {
  try {
    // ✅ SECURITY: Validate inputs
    const validationResult = updateFamilyMembersSchema.safeParse({ contactId, familyMembers });
    
    if (!validationResult.success) {
      return { 
        success: false, 
        error: `Invalid input: ${validationResult.error.issues.map(i => i.message).join(", ")}` 
      };
    }

    const { contactId: validatedContactId, familyMembers: validatedFamilyMembers } = validationResult.data;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.id) throw new Error("Unauthorized");

    // Deduplicate family members by name (case-insensitive)
    const deduplicatedMembers: any[] = [];
    const seenNames = new Set<string>();
    
    for (const member of validatedFamilyMembers) {
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


const addFamilyMemberSchema = z.object({
  contactId: z.string().uuid("Invalid contact ID format"),
  member: familyMemberSchema,
});

export async function addFamilyMember(contactId: string, member: any) {
  try {
    // ✅ SECURITY: Validate inputs
    const validationResult = addFamilyMemberSchema.safeParse({ contactId, member });
    
    if (!validationResult.success) {
      return { 
        success: false, 
        error: `Invalid input: ${validationResult.error.issues.map(i => i.message).join(", ")}` 
      };
    }

    const { contactId: validatedContactId, member: validatedMember } = validationResult.data;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.id) throw new Error("Unauthorized");

    // Fetch current family members
    const { data: contact, error: fetchError } = await (supabase as any)
      .from('persons')
      .select('family_members')
      .eq('id', validatedContactId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !contact) throw new Error("Contact not found");

    const currentMembers = Array.isArray(contact.family_members) ? contact.family_members : [];
    const newMembers = [...currentMembers, validatedMember];

    const { error: updateError } = await (supabase as any)
      .from('persons')
      .update({ family_members: newMembers })
      .eq('id', validatedContactId)
      .eq('user_id', user.id);

    if (updateError) throw updateError;

    // Auto-trigger AI summary refresh when family members change
    try {
      const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      fetch(`${origin}/api/refresh-ai-summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId: validatedContactId }),
      }).catch(err => console.error('Background AI refresh failed:', err));
    } catch (refreshError) {
      console.log('Could not trigger background AI refresh');
    }

    revalidatePath(`/contacts/${validatedContactId}`);
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error adding family member:", error);
    return { success: false, error: message };
  }
}

