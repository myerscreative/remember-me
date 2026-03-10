'use server';

import { createClient } from '@/lib/supabase/server';
import { z } from "zod";

const vCardContactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name too long"),
  first_name: z.string().trim().max(100).optional().nullable(),
  last_name: z.string().trim().max(100).optional().nullable(),
  email: z.string().email("Invalid email format").optional().nullable().or(z.literal("")),
  phone: z.string().trim().max(50).optional().nullable(),
  photo: z.string().trim().url("Invalid photo URL").optional().nullable().or(z.literal("")),
  birthday: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const plantContactsSchema = z.object({
  contacts: z.array(vCardContactSchema).max(500, "Too many contacts to import at once"),
});

export async function plantContacts(contacts: any[]): Promise<{ success: boolean; error?: string; created?: number; updated?: number; failed?: number; errors?: string[] }> {
  try {
    const validationResult = plantContactsSchema.safeParse({ contacts });
    
    if (!validationResult.success) {
      return { 
        success: false, 
        error: `Invalid input: ${validationResult.error.issues.map(i => i.message).join(", ")}` 
      };
    }

    const { contacts: validatedContacts } = validationResult.data;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.id) {
      return { success: false, error: "User not authenticated" };
    }

    let updatedCount = 0;
    let insertedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    // Fetch existing contacts for matching
    const { data: existingContacts, error: fetchError } = await (supabase as any)
      .from('persons')
      .select('id, email, name, photo_url')
      .eq('user_id', user.id);

    if (fetchError) {
      return { success: false, error: `Failed to fetch existing contacts: ${fetchError.message}` };
    }

    // Create lookup maps
    const emailMap = new Map<string, any>();
    const nameMap = new Map<string, any>();

    existingContacts?.forEach((c: any) => {
      if (c.email) emailMap.set(c.email.toLowerCase(), c);
      if (c.name) nameMap.set(c.name.toLowerCase(), c);
    });

    // Handle "imported" tag
    const tagName = 'imported';
    let tag: any;
    const { data: initialTag, error: tagError } = await (supabase as any)
      .from('tags')
      .select()
      .eq('name', tagName)
      .eq('user_id', user.id)
      .single();

    tag = initialTag;

    if (tagError && tagError.code !== 'PGRST116') {
      console.error('Error fetching imported tag:', tagError);
    }

    if (!tag) {
      const { data: newTag, error: insertTagError } = await (supabase as any)
        .from('tags')
        .insert({ name: tagName, user_id: user.id })
        .select()
        .single();
      
      if (!insertTagError) {
        tag = newTag;
      }
    }

    // Batched operation details
    const personTagsToInsert: any[] = [];

    for (const contact of validatedContacts) {
      try {
        let match: any = null;
        if (contact.email) match = emailMap.get(contact.email.toLowerCase());
        if (!match && contact.name) match = nameMap.get(contact.name.toLowerCase());

        let photoUrl = match?.photo_url || null;
        if (contact.photo) {
          const uploadedUrl = await uploadAvatar(supabase, user.id, match?.id || 'new', contact.photo);
          if (uploadedUrl) photoUrl = uploadedUrl;
        }

        if (match) {
          // UPDATE
          const updatePayload: any = { updated_at: new Date().toISOString() };
          if (photoUrl !== match.photo_url) updatePayload.photo_url = photoUrl;
          if (contact.phone) updatePayload.phone = contact.phone;
          
          if (Object.keys(updatePayload).length > 1) {
             const { error: updateError } = await (supabase as any)
              .from('persons')
              .update(updatePayload)
              .eq('id', match.id);

            if (updateError) throw updateError;
            updatedCount++;
          } else {
            updatedCount++;
          }
          
          // Link tag regardless if not already inserted
          if (tag) {
            const { data: existingTagLink } = await (supabase as any)
              .from('person_tags')
              .select('person_id')
              .eq('person_id', match.id)
              .eq('tag_id', tag.id)
              .single();
              
            if (!existingTagLink) {
              await (supabase as any).from('person_tags').insert({
                person_id: match.id,
                tag_id: tag.id
              });
            }
          }

        } else {
          // INSERT
          const { data: newContact, error: insertError } = await (supabase as any)
            .from('persons')
            .insert({
              user_id: user.id,
              name: contact.name,
              first_name: contact.first_name,
              last_name: contact.last_name,
              email: contact.email,
              phone: contact.phone,
              birthday: contact.birthday,
              notes: contact.notes,
              photo_url: photoUrl,
              imported: true,
              has_context: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (insertError) throw insertError;
          insertedCount++;
          
          if (tag && newContact) {
            personTagsToInsert.push({
              person_id: newContact.id,
              tag_id: tag.id
            });
          }
        }

      } catch (err: any) {
        console.error(`Error processing contact ${contact.name}:`, err);
        failedCount++;
        errors.push(`${contact.name}: ${err.message}`);
      }
    }
    
    // Bulk insert tags for newly created contacts
    if (personTagsToInsert.length > 0) {
      await (supabase as any).from('person_tags').insert(personTagsToInsert);
    }

    return { 
      success: true, 
      created: insertedCount, 
      updated: updatedCount, 
      failed: failedCount, 
      errors 
    };

  } catch (error: any) {
    console.error('Fatal import error:', error);
    return { success: false, error: error.message };
  }
}

async function uploadAvatar(supabase: any, userId: string, contactIdPrefix: string, base64Data: string): Promise<string | null> {
    try {
        const base64Match = base64Data.match(/^data:image\/(\w+);base64,(.+)$/);
        if (!base64Match) return null;

        const imageType = base64Match[1];
        const base64 = base64Match[2];
        const buffer = Buffer.from(base64, 'base64');
        
        const filename = `${userId}/${contactIdPrefix}-${Date.now()}-${Math.random().toString(36).substring(7)}.${imageType}`;

        const { data, error } = await supabase.storage
            .from('avatars')
            .upload(filename, buffer, {
                contentType: `image/${imageType}`,
                upsert: true
            });

        if (error) {
            console.error('Storage upload error:', error);
            return null;
        }

        const { data: urlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(data.path);

        return urlData.publicUrl;
    } catch (e) {
        console.error('Avatar upload exception:', e);
        return null;
    }
}
