'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { 
  Zap, 
  Clock, 
  MessageSquare, 
  Brain,
  ArrowRight
} from 'lucide-react';

interface LedgerStats {
  successRate: number;
  avgResponseTimeMin: number;
  totalOutreach: number;
  successfulHooks: string[];
}

export function LearningLedgerSection() {
  const [stats, setStats] = useState<LedgerStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLedgerData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: ledgerEntries } = await supabase
        .from('learning_ledger')
        .select(`
          actual_outcome,
          response_time_ms,
          interactions:outreach_id (notes)
        `)
        .eq('user_id', user.id);

      if (!ledgerEntries || ledgerEntries.length === 0) {
        setLoading(false);
        return;
      }

      const total = ledgerEntries.length;
      const successful = (ledgerEntries as any[]).filter(e => e.actual_outcome).length;
      const responseTimes = (ledgerEntries as any[])
        .filter(e => e.actual_outcome && e.response_time_ms)
        .map(e => Number(e.response_time_ms));
      
      const avgMs = responseTimes.length > 0 
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
        : 0;

      const hooks = (ledgerEntries as any[])
        .filter(e => e.actual_outcome && e.interactions?.notes)
        .map(e => e.interactions.notes)
        .slice(0, 3);

      setStats({
        successRate: Math.round((successful / total) * 100),
        avgResponseTimeMin: Math.round(avgMs / 60000),
        totalOutreach: total,
        successfulHooks: hooks
      });
      setLoading(false);
    }

    loadLedgerData();
  }, []);

  if (loading) return (
    <div className="h-48 animate-pulse bg-slate-100 dark:bg-slate-800 rounded-xl" />
  );

  if (!stats) return (
    <Card className="p-12 text-center bg-slate-50 dark:bg-slate-900 border-dashed border-slate-200 dark:border-slate-800">
      <Brain className="h-12 w-12 text-slate-300 mx-auto mb-4" />
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Learning Ledger Empty</h3>
      <p className="text-sm text-slate-500 max-w-sm mx-auto">
        Start sending outreach with the Pre-Send Auditor to see learning insights here.
      </p>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-1">
            <Zap className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Resonance Rate</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{stats.successRate}%</div>
        </div>
        
        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
            <Clock className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Avg Response</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{stats.avgResponseTimeMin}m</div>
        </div>

        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800">
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-1">
            <MessageSquare className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Training Data</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{stats.totalOutreach} pts</div>
        </div>
      </div>

      <Card className="overflow-hidden border-slate-200 dark:border-slate-800">
        <div className="p-6 bg-linear-to-br from-indigo-600 to-purple-700">
          <div className="flex items-center gap-2 text-white/80 mb-2">
            <Brain className="h-5 w-5" />
            <h3 className="text-sm font-black uppercase tracking-widest">Ledger Insight</h3>
          </div>
          <p className="text-xl font-bold text-white mb-6">
            Your best-performing hooks reference {stats.successRate > 70 ? 'specific shared memories' : 'recent events'} and carry low recipient burden.
          </p>
          <Button className="bg-white text-indigo-600 hover:bg-white/90 font-bold">
            Refine Training Model <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
        
        <div className="p-6 bg-white dark:bg-slate-900">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Successful &quot;Gold&quot; Hooks</h4>
          <div className="space-y-3">
            {stats.successfulHooks.map((hook, i) => (
              <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-300 italic">
                &quot;{hook}&quot;
              </div>
            ))}
          </div>
        </div>
      </Card>
      
      {/* AI Suggestion with Action Purple CTA */}
      <div className="p-6 bg-slate-900 rounded-2xl border border-indigo-500/30 shadow-2xl shadow-indigo-500/10 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
          <Zap className="h-24 w-24 text-indigo-500" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
             <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 text-[10px] font-black rounded uppercase tracking-widest border border-indigo-500/30">
               AI Strategic Recommendation
             </span>
          </div>
          <h3 className="text-2xl font-black text-white mb-2">Shift to &quot;Low-Stakes&quot; Follow-ups</h3>
          <p className="text-slate-400 mb-6 max-w-xl">
            Based on your response velocity, contacts are 3x more likely to reply to messages sent without an immediate &quot;Ask&quot;. We recommend two weeks of &quot;Nurture-Only&quot; outreach.
          </p>
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest px-8 shadow-xl shadow-indigo-600/20">
            Apply Global Strategy
          </Button>
        </div>
      </div>
    </div>
  );
}
