import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import TriageList, { TriageContact } from './components/TriageList';
import TriageEnrichmentList from './components/TriageEnrichmentList';
import TriageHeader from './components/TriageHeader';

export const dynamic = 'force-dynamic';

interface TriagePageProps {
  searchParams: Promise<{ mode?: string }>;
}

export default async function TriagePage({ searchParams }: TriagePageProps) {
  const { mode } = await searchParams;
  const isEnrichmentMode = mode === 'enrichment';

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // Fetch contacts based on mode
  let query = supabase
    .from('persons')
    .select('id, name, first_name, last_name, last_contact, last_interaction_date, importance, notes, has_context')
    .eq('user_id', user.id)
    .eq('archived', false);

  if (isEnrichmentMode) {
    query = query.eq('has_context', false);
  } else {
    query = query.is('importance', null);
  }

  const { data: persons, error } = await query;

  // Smart Redirect Logic
  // If in default mode with 0 results, but there are contacts needing context, redirect to enrichment
  if (!isEnrichmentMode && persons?.length === 0) {
    const { count: enrichmentCount } = await supabase
      .from('persons')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('archived', false)
      .eq('has_context', false);

    if (enrichmentCount && enrichmentCount > 0) {
      redirect('/triage?mode=enrichment');
    }
  }

  if (error) {
    console.error("Error fetching triage contacts:", error);
    return (
      <div className="p-8 text-center text-red-600">
        Failed to load contacts. Please try again.
      </div>
    );
  }

  // Process and sort contacts
  const contacts: TriageContact[] = (persons || []).map((p: {
    id: string;
    name: string | null;
    first_name: string | null;
    last_name: string | null;
    last_contact: string | null;
    last_interaction_date: string | null;
    importance: string | null;
    notes: string | null;
  }) => {
    const dateStr = p.last_contact || p.last_interaction_date;
    const date = dateStr ? new Date(dateStr).getTime() : 0;
    
    const now = new Date().getTime();
    const diffDays = dateStr ? Math.ceil(Math.abs(now - date) / (1000 * 60 * 60 * 24)) : 999;
    
    let status: 'healthy' | 'good' | 'warning' | 'dying' = 'dying';
    if (diffDays <= 7) status = 'healthy';
    else if (diffDays <= 21) status = 'good';
    else if (diffDays <= 45) status = 'warning';

    return {
      id: p.id,
      name: p.name || `${p.first_name} ${p.last_name}`.trim(),
      importance: p.importance as TriageContact['importance'],
      status,
      daysAgo: diffDays,
      lastDate: date,
      notes: p.notes
    };
  }).sort((a, b) => {
    if (a.lastDate === 0 && b.lastDate === 0) return a.name.localeCompare(b.name);
    if (a.lastDate === 0) return -1;
    if (b.lastDate === 0) return 1;
    return a.lastDate - b.lastDate;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] font-sans transition-colors pb-24">
      <div className="max-w-4xl mx-auto px-4 py-4 md:py-8">
        <TriageHeader isEnrichment={isEnrichmentMode} />

        <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          {isEnrichmentMode ? (
            <TriageEnrichmentList initialContacts={contacts} />
          ) : (
            <TriageList initialContacts={contacts} />
          )}
        </div>

        {contacts.length === 0 && !isEnrichmentMode && (
          <div className="mt-8 p-10 bg-slate-100/50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center">
             <p className="text-slate-600 dark:text-slate-300 font-medium">
               All your seeds are planted! To give the AI more context, try adding a few notes to your contacts in their individual profiles.
             </p>
          </div>
        )}
      </div>
    </div>
  );
}
