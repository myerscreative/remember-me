'use server';

import { createClient } from '@/lib/supabase/server';
import { ImportedContact } from '@/lib/contacts/importUtils';
import { z } from "zod";

// ✅ SECURITY: Validation schemas for vCard import
const vCardContactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name too long"),
  first_name: z.string().trim().max(100).optional().nullable(),
  last_name: z.string().trim().max(100).optional().nullable(),
  email: z.string().email("Invalid email format").optional().nullable().or(z.literal("")),
  phone: z.string().trim().max(50).optional().nullable(),
  photo: z.string().trim().url("Invalid photo URL").optional().nullable().or(z.literal("")),
  birthday: z.string().optional().nullable(), // Assuming birthday is a string for now
  notes: z.string().optional().nullable(),
});

const importVCardSchema = z.object({
  contacts: z.array(vCardContactSchema).max(500, "Too many contacts to import at once"),
});

export async function importVCard(contacts: any[]): Promise<{ success: boolean; error?: string; total?: number; created?: number; updated?: number; failed?: number; errors?: string[] }> {
  try {
    // ✅ SECURITY: Validate inputs
    const validationResult = importVCardSchema.safeParse({ contacts });
    
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
      .select('id, email, name, photo_url, notes, interests')
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

    for (const contact of validatedContacts) {
      try {
        // MATCHING LOGIC
        let match: any = null;
        if (contact.email) {
          match = emailMap.get(contact.email.toLowerCase());
        }
        if (!match && contact.name) {
          match = nameMap.get(contact.name.toLowerCase());
        }

        // Upload Photo if present
        let photoUrl = match?.photo_url || null; // Default to existing
        if (contact.photo) {
          const uploadedUrl = await uploadAvatar(supabase, user.id, match?.id || 'new', contact.photo);
          if (uploadedUrl) {
            photoUrl = uploadedUrl;
          }
        }

        if (match) {
          // UPDATE (Selective)
          // ONLY update: photo_url, phone
          // PRESERVE: notes, interests (do not touch them in the update payload)
          
          const updatePayload: any = {
            updated_at: new Date().toISOString(),
          };

          if (photoUrl !== match.photo_url) {
            updatePayload.photo_url = photoUrl;
          }

          if (contact.phone) {
             updatePayload.phone = contact.phone;
          }
          
          // Only perform update if there's something to update
          if (Object.keys(updatePayload).length > 1) { // > 1 because updated_at is always there
             const { error: updateError } = await (supabase as any)
              .from('persons')
              .update(updatePayload)
              .eq('id', match.id);

            if (updateError) throw updateError;
            updatedCount++;
          } else {
            // No relevant changes
            updatedCount++; // Count as processed/updated even if no change needed
          }

        } else {
          // INSERT (New Contact)
          const { error: insertError } = await (supabase as any)
            .from('persons')
            .insert({
              user_id: user.id,
              name: contact.name,
              first_name: contact.first_name,
              last_name: contact.last_name,
              email: contact.email,
              phone: contact.phone,
              birthday: contact.birthday,
              notes: contact.notes, // Safe to set on creation
              photo_url: photoUrl,
              imported: true,
              has_context: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

          if (insertError) throw insertError;
          insertedCount++;
        }

      } catch (err: any) {
        console.error(`Error processing contact ${contact.name}:`, err);
        failedCount++;
        errors.push(`${contact.name}: ${err.message}`);
      }
    }

    return { 
      success: true, 
      total: validatedContacts.length, 
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


// Helper: Upload Avatar
async function uploadAvatar(supabase: any, userId: string, contactIdPrefix: string, base64Data: string): Promise<string | null> {
    try {
        // Reuse logic from avatarSyncUtils but adapt for server
        const base64Match = base64Data.match(/^data:image\/(\w+);base64,(.+)$/);
        if (!base64Match) return null;

        const imageType = base64Match[1];
        const base64 = base64Match[2];
        const buffer = Buffer.from(base64, 'base64');
        
        // Randomize filename slightly to avoid collisions or caching issues
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
