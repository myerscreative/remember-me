'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.id) throw new Error("Unauthorized");

    // Fetch existing
    const { data: contact, error: fetchError } = await (supabase as any)
      .from('persons')
      .select('gift_ideas')
      .eq('id', contactId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !contact) throw fetchError || new Error("Contact not found");

    const currentIdeas = Array.isArray(contact.gift_ideas) ? contact.gift_ideas : [];
    
    const newIdea: GiftIdea = {
      id: crypto.randomUUID(),
      item,
      context,
      url,
      status: 'idea',
      created_at: new Date().toISOString()
    };

    const newIdeas = [...currentIdeas, newIdea];

    const { error: updateError } = await (supabase as any)
      .from('persons')
      .update({ gift_ideas: newIdeas })
      .eq('id', contactId)
      .eq('user_id', user.id);

    if (updateError) throw updateError;

    revalidatePath(`/contacts/${contactId}`);
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error adding gift idea:", error);
    return { success: false, error: message };
  }
}

export async function toggleGiftStatus(contactId: string, ideaId: string, status: 'idea' | 'purchased' | 'given') {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
  
      if (!user || !user.id) throw new Error("Unauthorized");
  
      const { data: contact, error: fetchError } = await (supabase as any)
        .from('persons')
        .select('gift_ideas')
        .eq('id', contactId)
        .eq('user_id', user.id)
        .single();
  
      if (fetchError || !contact) throw fetchError || new Error("Contact not found");
  
      const currentIdeas = Array.isArray(contact.gift_ideas) ? contact.gift_ideas : [];
      const newIdeas = currentIdeas.map((idea: GiftIdea) => {
          if (idea.id === ideaId) {
              return { ...idea, status };
          }
          return idea;
      });
  
      const { error: updateError } = await (supabase as any)
        .from('persons')
        .update({ gift_ideas: newIdeas })
        .eq('id', contactId)
        .eq('user_id', user.id);
  
      if (updateError) throw updateError;
  
      revalidatePath(`/contacts/${contactId}`);
      return { success: true };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("Error updating gift status:", error);
      return { success: false, error: message };
    }
}
