// Avatar Sync Utilities for Safe Re-import

import { createClient } from '@/lib/supabase/client';
import { ImportedContact } from './importUtils';

export interface AvatarSyncResult {
  updated: number;
  skipped: number;
  errors: string[];
}

export interface AvatarSyncPreview {
  willUpdate: { name: string; email: string | null }[];
  willSkip: { name: string; reason: string }[];
  noMatch: { name: string; email: string | null }[];
  totalWithPhotos: number;
}

/**
 * Sync avatars from imported contacts without duplicating or overwriting data
 * Only updates photo_url for matching contacts
 */
export async function syncAvatarsFromVCF(
  contacts: ImportedContact[],
  userId: string
): Promise<AvatarSyncResult> {
  const supabase = createClient();
  const result: AvatarSyncResult = {
    updated: 0,
    skipped: 0,
    errors: [],
  };

  // Filter to only contacts with photos
  const contactsWithPhotos = contacts.filter(c => c.photo);

  if (contactsWithPhotos.length === 0) {
    return { ...result, errors: ['No contacts with photos found in file'] };
  }

  // Get all existing contacts for this user
  const { data: existingContacts, error: fetchError } = await (supabase as any)
    .from('persons')
    .select('id, name, email, photo_url')
    .eq('user_id', userId);

  if (fetchError) {
    return { ...result, errors: [`Failed to fetch contacts: ${fetchError.message}`] };
  }

  // Create lookup maps for matching
  const emailMap = new Map<string, { id: string; photo_url: string | null }>();
  const nameMap = new Map<string, { id: string; photo_url: string | null }>();

  for (const contact of existingContacts || []) {
    if (contact.email) {
      emailMap.set(contact.email.toLowerCase(), { id: contact.id, photo_url: contact.photo_url });
    }
    if (contact.name) {
      nameMap.set(contact.name.toLowerCase(), { id: contact.id, photo_url: contact.photo_url });
    }
  }

  // Process each contact with a photo
  for (const contact of contactsWithPhotos) {
    // Try to match by email first, then by name
    let matchedContact: { id: string; photo_url: string | null } | undefined;

    if (contact.email) {
      matchedContact = emailMap.get(contact.email.toLowerCase());
    }

    if (!matchedContact && contact.name) {
      matchedContact = nameMap.get(contact.name.toLowerCase());
    }

    if (!matchedContact) {
      result.skipped++;
      continue;
    }

    // Skip if contact already has a photo
    if (matchedContact.photo_url) {
      result.skipped++;
      continue;
    }

    try {
      // Upload photo to Supabase storage
      const photoUrl = await uploadAvatarToStorage(
        supabase,
        userId,
        matchedContact.id,
        contact.photo!
      );

      if (photoUrl) {
        // Update contact with new photo URL
        const { error: updateError } = await (supabase as any)
          .from('persons')
          .update({ photo_url: photoUrl })
          .eq('id', matchedContact.id)
          .eq('user_id', userId);

        if (updateError) {
          result.errors.push(`Failed to update ${contact.name}: ${updateError.message}`);
        } else {
          result.updated++;
        }
      }
    } catch (err) {
      result.errors.push(`Failed to upload avatar for ${contact.name}`);
    }
  }

  return result;
}

/**
 * Upload base64 image data to Supabase storage
 */
async function uploadAvatarToStorage(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  contactId: string,
  base64Data: string
): Promise<string | null> {
  try {
    // Extract the actual base64 data (remove data URI prefix if present)
    const base64Match = base64Data.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!base64Match) {
      console.error('Invalid base64 image format');
      return null;
    }

    const imageType = base64Match[1];
    const base64 = base64Match[2];

    // Convert base64 to Blob
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: `image/${imageType}` });

    // Generate filename
    const filename = `${userId}/${contactId}-${Date.now()}.${imageType}`;

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filename, blob, {
        contentType: `image/${imageType}`,
        upsert: true,
      });

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch {
    console.error('Avatar upload failed');
    return null;
  }
}

/**
 * Preview avatar sync without making changes (Dry Run)
 */
export async function previewAvatarSync(
  contacts: ImportedContact[],
  userId: string
): Promise<AvatarSyncPreview> {
  const supabase = createClient();
  const preview: AvatarSyncPreview = {
    willUpdate: [],
    willSkip: [],
    noMatch: [],
    totalWithPhotos: 0,
  };

  // Filter to only contacts with photos
  const contactsWithPhotos = contacts.filter(c => c.photo);
  preview.totalWithPhotos = contactsWithPhotos.length;

  if (contactsWithPhotos.length === 0) {
    return preview;
  }

  // Get all existing contacts for this user
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existingContacts, error: fetchError } = await (supabase as any)
    .from('persons')
    .select('id, name, email, photo_url')
    .eq('user_id', userId);

  if (fetchError) {
    return preview;
  }

  // Create lookup maps for matching
  const emailMap = new Map<string, { id: string; name: string; email: string | null; photo_url: string | null }>();
  const nameMap = new Map<string, { id: string; name: string; email: string | null; photo_url: string | null }>();

  for (const contact of existingContacts || []) {
    if (contact.email) {
      emailMap.set(contact.email.toLowerCase(), contact);
    }
    if (contact.name) {
      nameMap.set(contact.name.toLowerCase(), contact);
    }
  }

  // Preview each contact
  for (const contact of contactsWithPhotos) {
    let matchedContact: { id: string; name: string; email: string | null; photo_url: string | null } | undefined;

    if (contact.email) {
      matchedContact = emailMap.get(contact.email.toLowerCase());
    }

    if (!matchedContact && contact.name) {
      matchedContact = nameMap.get(contact.name.toLowerCase());
    }

    if (!matchedContact) {
      preview.noMatch.push({ name: contact.name, email: contact.email });
      continue;
    }

    if (matchedContact.photo_url) {
      preview.willSkip.push({ name: matchedContact.name, reason: 'Already has photo' });
    } else {
      preview.willUpdate.push({ name: matchedContact.name, email: matchedContact.email });
    }
  }

  return preview;
}
