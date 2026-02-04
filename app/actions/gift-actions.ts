'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ✅ SECURITY: Validation schemas for gift ideas
const addGiftIdeaSchema = z.object({
  contactId: z.string().uuid("Invalid contact ID format"),
  item: z.string().trim().min(1, "Item name is required").max(200, "Item name too long"),
  context: z.string().trim().max(1000, "Context too long").optional(),
  url: z.string().url("Invalid URL format").max(500, "URL too long").optional().or(z.literal("")),
});

const toggleGiftStatusSchema = z.object({
  contactId: z.string().uuid("Invalid contact ID format"),
  ideaId: z.string().uuid("Invalid idea ID format"),
  status: z.enum(['idea', 'purchased', 'given']),
});

export interface GiftIdea {
  id: string;
  item: string;
  url?: string;
  context?: string;
  status: 'idea' | 'purchased' | 'given';
  created_at: string;
}

export async function addGiftIdea(contactId: string, item: string, context?: string, url?: string) {
  try {
    // ✅ SECURITY: Validate inputs
    const validationResult = addGiftIdeaSchema.safeParse({ contactId, item, context, url });
    
    if (!validationResult.success) {
      return { 
        success: false, 
        error: `Invalid input: ${validationResult.error.issues.map(i => i.message).join(", ")}` 
      };
    }

    const { contactId: validatedContactId, item: validatedItem, context: validatedContext, url: validatedUrl } = validationResult.data;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.id) throw new Error("Unauthorized");

    // Fetch existing
    const { data: contact, error: fetchError } = await (supabase as any)
      .from('persons')
      .select('gift_ideas')
      .eq('id', validatedContactId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !contact) throw new Error("Contact not found");

    const currentIdeas = Array.isArray(contact.gift_ideas) ? contact.gift_ideas : [];
    
    const newIdea: GiftIdea = {
      id: crypto.randomUUID(),
      item: validatedItem,
      context: validatedContext,
      url: validatedUrl,
      status: 'idea',
      created_at: new Date().toISOString()
    };

    const newIdeas = [...currentIdeas, newIdea];

    const { error: updateError } = await (supabase as any)
      .from('persons')
      .update({ gift_ideas: newIdeas })
      .eq('id', validatedContactId)
      .eq('user_id', user.id);

    if (updateError) throw updateError;

    revalidatePath(`/contacts/${validatedContactId}`);
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error adding gift idea:", error);
    return { success: false, error: message };
  }
}

export async function toggleGiftStatus(contactId: string, ideaId: string, status: 'idea' | 'purchased' | 'given') {
    try {
      // ✅ SECURITY: Validate inputs
      const validationResult = toggleGiftStatusSchema.safeParse({ contactId, ideaId, status });
      
      if (!validationResult.success) {
        return { 
          success: false, 
          error: `Invalid input: ${validationResult.error.issues.map(i => i.message).join(", ")}` 
        };
      }

      const { contactId: validatedContactId, ideaId: validatedIdeaId, status: validatedStatus } = validationResult.data;

      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
  
      if (!user || !user.id) throw new Error("Unauthorized");
  
      const { data: contact, error: fetchError } = await (supabase as any)
        .from('persons')
        .select('gift_ideas')
        .eq('id', validatedContactId)
        .eq('user_id', user.id)
        .single();
  
      if (fetchError || !contact) throw new Error("Contact not found");
  
      const currentIdeas = Array.isArray(contact.gift_ideas) ? contact.gift_ideas : [];
      const newIdeas = currentIdeas.map((idea: GiftIdea) => {
          if (idea.id === validatedIdeaId) {
              return { ...idea, status: validatedStatus };
          }
          return idea;
      });
  
      const { error: updateError } = await (supabase as any)
        .from('persons')
        .update({ gift_ideas: newIdeas })
        .eq('id', validatedContactId)
        .eq('user_id', user.id);
  
      if (updateError) throw updateError;
  
      revalidatePath(`/contacts/${validatedContactId}`);
      return { success: true };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("Error updating gift status:", error);
      return { success: false, error: message };
    }
}

