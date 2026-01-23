import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import TriageList, { TriageContact } from './components/TriageList';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function TriagePage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // Fetch all active contacts
  const { data: persons, error } = await supabase
    .from('persons')
    .select('id, name, first_name, last_name, last_contact, last_interaction_date, importance')
    .eq('user_id', user.id)
    .eq('archived', false);

  if (error) {
    console.error("Error fetching triage contacts:", error);
    return (
      <div className="p-8 text-center text-red-600">
        Failed to load contacts. Please try again.
      </div>
    );
  }

  // Process and sort contacts
  // Sort Order: Default sort by "Needs Love" (oldest last_interaction_date first)
  const contacts: TriageContact[] = (persons || []).map((p: any) => {
    // Calculate effective date for sorting/status
    const dateStr = p.last_contact || p.last_interaction_date;
    const date = dateStr ? new Date(dateStr).getTime() : 0; // 0 = very old
    
    // Status logic (same as garden)
    const now = new Date().getTime();
    const diffDays = dateStr ? Math.ceil(Math.abs(now - date) / (1000 * 60 * 60 * 24)) : 999;
    
    let status: 'healthy' | 'good' | 'warning' | 'dying' = 'dying';
    if (diffDays <= 7) status = 'healthy';
    else if (diffDays <= 21) status = 'good';
    else if (diffDays <= 45) status = 'warning';

    return {
      id: p.id,
      name: p.name || `${p.first_name} ${p.last_name}`.trim(),
      importance: p.importance as 'high' | 'medium' | 'low' || 'medium',
      status,
      daysAgo: diffDays,
      lastDate: date
    };
  }).sort((a, b) => {
    // Oldest date first (Ascending date)
    // If date is 0 (never), it should be first (needs most love)
    if (a.lastDate === 0 && b.lastDate === 0) return a.name.localeCompare(b.name);
    if (a.lastDate === 0) return -1;
    if (b.lastDate === 0) return 1;
    return a.lastDate - b.lastDate;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] font-sans transition-colors">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link href="/" className="inline-flex items-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 mb-2 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">🚨 Contact Triage</h1>
            <p className="text-slate-500 dark:text-slate-400">
              Rapidly categorize your contacts to build your garden.
            </p>
          </div>
          <Link 
            href="/garden"
            className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            Finish & View Garden →
          </Link>
        </div>

        <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <TriageList initialContacts={contacts} />
        </div>
      </div>
    </div>
  );
}
