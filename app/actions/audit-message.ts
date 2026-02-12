'use server';

import { createClient } from '@/lib/supabase/server';
import { PreSendAuditor } from '@/lib/ai/pre-send-auditor';

export async function auditDraftMessage(contactId: string, draft: string) {
  const supabase = await createClient();

  // 1. Fetch contact context
  const { data: contact } = await supabase
    .from('persons')
    .select('name, last_interaction_date, target_frequency_days')
    .eq('id', contactId)
    .single();

  const { data: memories } = await supabase
    .from('shared_memories')
    .select('content')
    .eq('person_id', contactId)
    .order('created_at', { ascending: false })
    .limit(3);

  if (!contact) throw new Error('Contact not found');

  const sharedMemories = memories?.map(m => (m as any).content) || [];
  
  // Calculate health status
  const daysSince = (contact as any).last_interaction_date 
    ? Math.floor((Date.now() - new Date((contact as any).last_interaction_date).getTime()) / (1000 * 60 * 60 * 24))
    : 999;
  const target = (contact as any).target_frequency_days || 30;
  const healthStatus = daysSince < target ? 'Nurtured' : (daysSince < target * 1.5 ? 'Drifting' : 'Neglected');

  // 1b. Fetch Successful Ledger Entries (Learning Ledger)
  const { data: ledgerEntries } = await supabase
    .from('learning_ledger')
    .select('interactions(notes)')
    .eq('contact_id', contactId)
    .eq('actual_outcome', true)
    .order('created_at', { ascending: false })
    .limit(5);

  const successfulHooks = (ledgerEntries as any)
    ?.map((entry: any) => entry.interactions?.notes)
    .filter(Boolean) as string[];

  // 2. Perform Audit
  return await PreSendAuditor.performAudit({
    contactName: (contact as any).name,
    userDraft: draft,
    last3Memories: sharedMemories,
    healthStatus,
    successfulHooks,
  });
}
