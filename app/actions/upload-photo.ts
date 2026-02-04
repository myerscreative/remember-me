'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

import { z } from 'zod';

// ✅ SECURITY: Validation schema for photo uploads
const uploadPhotoSchema = z.object({
  personId: z.string().uuid("Invalid person ID format"),
  // File validation is handled manually as Zod doesn't easily handle File objects in all environments
});

export async function uploadPersonPhoto(formData: FormData) {
  try {
    const personId = formData.get('personId') as string;
    const file = formData.get('file') as File;

    // ✅ SECURITY: Validate inputs
    const validationResult = uploadPhotoSchema.safeParse({ personId });
    
    if (!validationResult.success) {
      return { 
        success: false, 
        error: `Invalid input: ${validationResult.error.issues.map(i => i.message).join(", ")}` 
      };
    }

    const { personId: validatedPersonId } = validationResult.data;

    if (!file) {
      return { success: false, error: 'Missing file' };
    }


    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    // validate file size (e.g. 20MB)
    if (file.size > 20 * 1024 * 1024) {
      return { success: false, error: 'File too large (max 20MB)' };
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${validatedPersonId}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    // Upload to 'avatars' bucket
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return { success: false, error: 'Failed to upload image' };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    // Update person record
    const { error: updateError } = await (supabase as any)
      .from('persons')
      .update({ photo_url: publicUrl })
      .eq('id', validatedPersonId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Database update error:', updateError);
      return { success: false, error: 'Failed to update person record' };
    }

    revalidatePath(`/contacts/${validatedPersonId}`);
    return { success: true, url: publicUrl };


  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
