'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function uploadPersonPhoto(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    const personId = formData.get('personId') as string;

    if (!file || !personId) {
      return { success: false, error: 'Missing file or person ID' };
    }

    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    // validate file size (e.g. 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: 'File too large (max 5MB)' };
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${personId}-${Date.now()}.${fileExt}`;
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
      .eq('id', personId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Database update error:', updateError);
      return { success: false, error: 'Failed to update person record' };
    }

    revalidatePath(`/contacts/${personId}`);
    return { success: true, url: publicUrl };

  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
