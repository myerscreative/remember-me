'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export type FeedbackResult =
  | { success: true; error?: never }
  | { success: false; error: string; details?: any };

export async function submitFeedback(formData: FormData): Promise<FeedbackResult> {
  const supabase = await createClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return { success: false, error: 'Not authenticated', details: userError };
  }

  const category = formData.get('category') as string;
  const description = formData.get('description') as string;
  const currentPage = formData.get('currentPage') as string;
  const screenshot = formData.get('screenshot') as File | null;

  if (!category || !description || !currentPage) {
    return { success: false, error: 'Missing required fields' };
  }

  try {
    let screenshotUrl: string | null = null;

    // Handle screenshot upload if provided
    if (screenshot && screenshot.size > 0) {
      const fileExt = screenshot.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const filePath = fileName;

      // Convert File to Buffer for Supabase upload
      const arrayBuffer = await screenshot.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { error: uploadError } = await supabase.storage
        .from('feedback_screenshots')
        .upload(filePath, buffer, {
          contentType: screenshot.type,
          upsert: true
        });

      if (uploadError) {
        console.error('Error uploading screenshot:', uploadError);
        return { success: false, error: 'Failed to upload screenshot', details: uploadError };
      }

      const { data: { publicUrl } } = supabase.storage
        .from('feedback_screenshots')
        .getPublicUrl(filePath);
      
      screenshotUrl = publicUrl;
    }

    // Insert feedback record
    const { error: insertError } = await (supabase as any).from('feedback').insert({
      user_id: user.id,
      category,
      description,
      screenshot_url: screenshotUrl,
      current_page: currentPage,
    });

    if (insertError) {
      console.error('Error inserting feedback:', insertError);
      return { success: false, error: insertError.message || 'Failed to submit feedback', details: insertError };
    }

    // Revalidate paths if necessary
    revalidatePath('/admin/feedback'); 
    
    return { success: true };
  } catch (err: any) {
    console.error('Error in submitFeedback:', err);
    return { success: false, error: err.message || 'An unexpected error occurred', details: err };
  }
}
