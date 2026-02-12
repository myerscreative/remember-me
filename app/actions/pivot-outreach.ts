'use server';

import { createClient } from '@/lib/supabase/server';
import { SocialFrictionAuditor } from '@/lib/ai/social-friction-pivot';
import { revalidatePath } from 'next/cache';

/**
 * Refines a failed outreach hook using the Social Friction Auditor.
 */
export async function refineOutreachHook(contactId: string, originalHook: string) {
  const supabase = await createClient();

  // 1. Fetch contact details and shared memories
  const { data: contact } = await supabase
    .from('persons')
    .select('name, importance, last_interaction_date')
    .eq('id', contactId)
    .single();

  const { data: memories } = await supabase
    .from('shared_memories')
    .select('content')
    .eq('person_id', contactId)
    .limit(5);

  if (!contact) throw new Error('Contact not found');

  const sharedMemories = memories?.map(m => (m as any).content) || [];
  const health = (contact as any).last_interaction_date 
    ? (new Date((contact as any).last_interaction_date).getTime() < Date.now() - 30 * 24 * 60 * 60 * 1000 ? 'Neglected' : 'Drifting')
    : 'New';

  // 2. Run Audit
  const auditResult = await SocialFrictionAuditor.refineAsset({
    contactName: (contact as any).name,
    originalHook,
    sharedMemories,
    relationshipHealth: health,
  });

  return {
    ...auditResult,
    contactName: (contact as any).name,
  };
}

/**
 * Saves the pivoted interaction to prevent 'Amnesia'.
 */
export async function savePivotedInteraction(contactId: string, content: string) {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Insert interaction
  const { error } = await (supabase.from('interactions') as any).insert({
    person_id: contactId,
    user_id: user.id,
    notes: content,
    type: 'message',
    date: new Date().toISOString(),
    title: 'Bridge Pivot'
  });

  if (error) throw error;

  revalidatePath('/dashboard');
  revalidatePath('/admin/dashboard');

  return { success: true };
}
