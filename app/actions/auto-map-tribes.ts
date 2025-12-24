'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

interface MappingRule {
  tribe: string;
  keywords: string[];
}

const TRIBE_RULES: MappingRule[] = [
  { tribe: "NASA", keywords: ["NASA", "Space", "Engineering", "Mission"] },
  { tribe: "Basketball", keywords: ["Hoops", "Ball", "Gym", "Court", "Basketball"] },
  { tribe: "Japan", keywords: ["Japan", "Tokyo", "Travel", "Kyoto", "Osaka"] },
];

export async function autoMapTribes() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    // 1. Fetch all contacts for this user
    const { data: contacts, error: fetchError } = await supabase
      .from('persons')
      .select('id, name, notes, relationship_summary, what_found_interesting')
      .eq('user_id', user.id);

    if (fetchError) throw fetchError;
    if (!contacts) return { success: true, count: 0 };

    let updatedCount = 0;

    // 2. Ensure tribal tags exist
    for (const rule of TRIBE_RULES) {
      const { data: tag, error: tagError } = await (supabase as any)
        .from('tags')
        .select('id')
        .eq('name', rule.tribe)
        .maybeSingle();

      let tagId;
      if (!tag) {
        const { data: newTag, error: createError } = await (supabase as any)
          .from('tags')
          .insert({ name: rule.tribe })
          .select('id')
          .single();
        if (createError) throw createError;
        tagId = newTag.id;
      } else {
        tagId = tag.id;
      }

      // 3. Scan contacts and map
      for (const contact of contacts) {
        const searchStr = `${contact.notes || ''} ${contact.relationship_summary || ''} ${contact.what_found_interesting || ''}`.toLowerCase();
        const matches = rule.keywords.some(kw => searchStr.includes(kw.toLowerCase()));

        if (matches) {
          // Check if already tagged
          const { data: existing } = await (supabase as any)
            .from('person_tags')
            .select('*')
            .eq('person_id', contact.id)
            .eq('tag_id', tagId)
            .maybeSingle();

          if (!existing) {
            await (supabase as any)
              .from('person_tags')
              .insert({ person_id: contact.id, tag_id: tagId });
            updatedCount++;
          }
        }
      }
    }

    // 4. Professional categorization
    // In this schema, 'where_met' or a 'Company' tag might be used. 
    // Let's assume keywords in relationship summary or notes indicate work.
    for (const contact of contacts as any[]) {
      const searchStr = `${contact.notes || ''} ${contact.relationship_summary || ''}`.toLowerCase();
      if (searchStr.includes('work') || searchStr.includes('client') || searchStr.includes('colleague')) {
        const category = searchStr.includes('client') ? 'Clients' : 'Work';
        // Note: The schema doesn't have a direct 'category' column on persons, 
        // but it has tags. Let's map these to tags as well for consistency.
        
        const { data: tag } = await (supabase as any).from('tags').select('id').eq('name', category).maybeSingle();
        let tagId;
        if (!tag) {
          const { data: newTag } = await (supabase as any).from('tags').insert({ name: category }).select('id').single();
          tagId = newTag?.id;
        } else {
          tagId = tag.id;
        }

        if (tagId) {
          await (supabase as any).from('person_tags').upsert({ person_id: contact.id, tag_id: tagId });
        }
      }
    }

    revalidatePath('/dashboard');
    revalidatePath('/network');
    
    return { success: true, count: updatedCount };
  } catch (error: any) {
    console.error("Error auto-mapping tribes:", error);
    return { success: false, error: error.message };
  }
}
