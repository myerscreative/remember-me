'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { createContactSchema } from '@/lib/validations';

export type CreateContactInput = {
  first_name: string;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  job_title?: string | null;
  where_met?: string | null;
  importance?: 'low' | 'medium' | 'high' | 'critical' | null;
  target_frequency_days?: number | null;
  birthday?: string | null;
  linkedin?: string | null;
  notes?: string | null;
  family_members?: Array<{ name: string; relationship: string }> | null;
  interests?: string[] | null;
  who_introduced?: string | null;
  why_stay_in_contact?: string | null;
  what_found_interesting?: string | null;
  most_important_to_them?: string | null;
  first_impression?: string | null;
  memorable_moment?: string | null;
  imported?: boolean;
  has_context?: boolean;
};

export type CreateContactResult = {
  success: boolean;
  id?: string;
  error?: string;
};

/**
 * Centralized contact creation with correct baseline for Health Logic.
 * - created_at: Explicitly set to now (belt-and-suspenders; DB also has DEFAULT)
 * - last_contact / last_interaction_date: Explicitly null (never 1970-01-01)
 * - target_frequency_days: Defaults to 30 (Monthly) when not specified
 */
export async function createContact(
  input: CreateContactInput
): Promise<CreateContactResult> {
  try {
    const validation = createContactSchema.safeParse({
      first_name: input.first_name,
      last_name: input.last_name ?? null,
      email: input.email ?? null,
      phone: input.phone ?? null,
      company: input.company ?? null,
      job_title: input.job_title ?? null,
      where_met: input.where_met ?? null,
      importance: input.importance ?? null,
      target_frequency_days: input.target_frequency_days ?? null,
      birthday: input.birthday ?? null,
      first_impression: input.first_impression ?? null,
      memorable_moment: input.memorable_moment ?? null,
    });

    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues.map((i) => i.message).join(', '),
      };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id) {
      return { success: false, error: 'Not authenticated' };
    }

    const fullName =
      [input.first_name, input.last_name].filter(Boolean).join(' ').trim() ||
      input.first_name;

    const nowIso = new Date().toISOString();

    const insertPayload = {
      user_id: user.id,
      name: fullName,
      first_name: input.first_name.trim(),
      last_name: (input.last_name?.trim() || null) as string | null,
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      linkedin: input.linkedin?.trim() || null,
      company: input.company?.trim() || null,
      job_title: input.job_title?.trim() || null,
      where_met: input.where_met?.trim() || null,
      who_introduced: input.who_introduced?.trim() || null,
      why_stay_in_contact: input.why_stay_in_contact?.trim() || null,
      what_found_interesting: input.what_found_interesting?.trim() || null,
      most_important_to_them: input.most_important_to_them?.trim() || null,
      first_impression: input.first_impression?.trim() || null,
      memorable_moment: input.memorable_moment?.trim() || null,
      notes: input.notes?.trim() || null,
      family_members: input.family_members ?? null,
      interests: input.interests ?? null,
      birthday: input.birthday || null,
      importance: input.importance ?? 'medium',
      imported: input.imported ?? false,
      has_context: input.has_context ?? false,

      // Health Logic baseline - explicit to avoid any DB default quirks
      created_at: nowIso,
      updated_at: nowIso,
      last_contact: null,
      last_interaction_date: null,

      // Default cadence: 30 (Monthly) when not specified
      target_frequency_days: input.target_frequency_days ?? 30,
    };

    const { data, error } = await (supabase as any)
      .from('persons')
      .insert(insertPayload)
      .select('id')
      .single();

    if (error) {
      console.error('createContact insert error:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/');
    revalidatePath('/contacts');
    revalidatePath('/network');

    return { success: true, id: data.id };
  } catch (err: unknown) {
    console.error('createContact fatal error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An unexpected error occurred',
    };
  }
}
