'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import OpenAI from 'openai';

export interface DriftingContact {
  id: string;
  name: string;
  lastInteractionDate: string | null;
  memoryDensity: number;
  suggestedHook: string;
  relationshipValue?: number;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function getDriftingContacts(): Promise<DriftingContact[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // 1. Fetch contacts
  const { data, error } = await supabase
    .from('persons')
    .select('id, name, last_interaction_date, target_frequency_days, importance, shared_memories(count)')
    .eq('user_id', user.id)
    .or('archived.eq.false,archived.is.null,archive_status.eq.false,archive_status.is.null');

  if (error || !data) return [];
  const contacts = data as any[];

  const now = new Date();
  const driftingContacts = contacts.filter(contact => {
    const importance = contact.importance || 'medium';
    const target = contact.target_frequency_days || (importance === 'high' ? 14 : importance === 'low' ? 90 : 30);
    
    if (!contact.last_interaction_date) return false;
    
    const lastDate = new Date(contact.last_interaction_date);
    const daysSince = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Drifting: Target + 5 <= DaysSince
    // However, we want to distinguish from Neglected (Target * 1.5)
    return daysSince >= (target + 5) && daysSince <= target * 1.5;
  });

  // 2. Sort by memory density (count of shared memories)
  const sortedDrift = driftingContacts
    .map(c => ({
      ...c,
      memoryCount: (c.shared_memories as any)?.[0]?.count || 0
    }))
    .sort((a, b) => b.memoryCount - a.memoryCount);

  // 3. Generate hooks for top 10 (parallelize for speed in production, but here we'll do sequential or small batch)
  const results: DriftingContact[] = [];
  
  for (const contact of sortedDrift.slice(0, 10)) {
    // Fetch some memories for the hook
    const { data: memories } = await supabase
      .from('shared_memories')
      .select('content')
      .eq('person_id', contact.id)
      .limit(3);

    const memoryContent = memories?.map(m => m.content).join('; ') || '';
    
    let suggestedHook = "Just thinking of you! Hope your week is going great.";

    if (memoryContent) {
      try {
        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are a social resonance engine. Generate a "Low-Stakes Recall" message. It must be short, casual, and reference a shared memory but require ZERO work for them to answer. No questions like "How are you?". Use statements or casual mentions.'
            },
            {
              role: 'user',
              content: `Contact: ${contact.name}. Memories: ${memoryContent}. Generate one casual social ping.`
            }
          ],
          temperature: 0.7,
          max_tokens: 60
        });
        suggestedHook = response.choices[0].message.content?.replace(/^["']|["']$/g, '') || suggestedHook;
      } catch (e) {
        console.error("AI Hook Generation Failed", e);
      }
    }

    results.push({
      id: contact.id,
      name: contact.name,
      lastInteractionDate: contact.last_interaction_date,
      memoryDensity: contact.memoryCount,
      suggestedHook
    });
  }

  return results;
}

export async function rescueContact(contactId: string, message: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  // 1. Log the interaction
  const { error: logError } = await supabase
    .from('interactions')
    .insert({
      person_id: contactId,
      user_id: user.id,
      type: 'message',
      notes: message,
      date: new Date().toISOString(),
      title: 'Drift Rescue'
    });

  if (logError) throw logError;

  // 2. Update contact status (last_interaction_date)
  const { error: updateError } = await supabase
    .from('persons')
    .update({
      last_interaction_date: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', contactId);

  if (updateError) throw updateError;

  revalidatePath('/dashboard');
  revalidatePath('/admin/dashboard');

  // Also update weekly_rescue status if it exists for this week
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6:1);
  const monday = new Date(now.setDate(diff)).toISOString().split('T')[0];

  await supabase
    .from('weekly_rescues')
    .update({ status: 'sent' })
    .eq('contact_id', contactId)
    .eq('week_date', monday);

  return { success: true };
}

export async function getWeeklyRescues(): Promise<DriftingContact[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const mondayStr = new Date(now.setDate(diff)).toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('weekly_rescues')
    .select('*, persons(name, last_interaction_date, shared_memories(count))')
    .eq('user_id', user.id)
    .eq('week_date', mondayStr)
    .eq('status', 'pending');

  if (error || !data) return [];

  return data.map(r => ({
    id: r.contact_id,
    name: (r.persons as any).name,
    lastInteractionDate: (r.persons as any).last_interaction_date,
    memoryDensity: (r.persons as any).shared_memories?.[0]?.count || 0,
    suggestedHook: r.suggested_hook,
    relationshipValue: r.relationship_value_score
  }));
}

export async function skipWeeklyRescue(contactId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const mondayStr = new Date(now.setDate(diff)).toISOString().split('T')[0];

  await supabase
    .from('weekly_rescues')
    .update({ status: 'skipped' })
    .eq('user_id', user.id)
    .eq('contact_id', contactId)
    .eq('week_date', mondayStr);

  revalidatePath('/admin/dashboard');
}
