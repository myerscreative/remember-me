'use client';

import React, { useEffect, useState } from 'react';
import { getWeeklySummary, WeeklySummary } from '@/lib/dashboard/getWeeklySummary';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
import { getInitialsFromFullName } from '@/lib/utils/contact-helpers';
import { useRouter } from 'next/navigation';
import MemoryCard from './MemoryCard';
import { SharedMemoryCard, RelationshipStatus } from '@/types/memory';

export function WeeklyBriefing() {
  const [summaries, setSummaries] = useState<WeeklySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const { data } = await getWeeklySummary();
      setSummaries(data || []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <Card className="border-white/5 bg-canvas/40 backdrop-blur-xl shadow-2xl animate-pulse rounded-2xl">
        <CardContent className="p-6 h-32 flex items-center justify-center">
            <div className="flex items-center gap-3 text-text-tertiary">
                <Sparkles className="w-5 h-5 animate-spin text-indigo-500/50"/>
                <span className="text-sm font-black uppercase tracking-widest opacity-50">Analyzing weekly context...</span>
            </div>
        </CardContent>
      </Card>
    );
  }

  if (summaries.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-black text-text-tertiary uppercase tracking-widest flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-indigo-500" />
            Recent Shared Memories & Garden Shifts
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {summaries.slice(0, 4).map((summary) => {
          // Map WeeklySummary to SharedMemoryCard
          const statusMap: Record<string, RelationshipStatus> = {
            blooming: 'Nurtured',
            nourished: 'Nurtured',
            thirsty: 'Drifting',
            fading: 'Neglected',
          };

          const memory: SharedMemoryCard = {
            id: summary.person_id,
            contactName: summary.name,
            initials: getInitialsFromFullName(summary.name),
            status: statusMap[summary.current_health] || 'Nurtured',
            statusLabel: summary.current_health.toUpperCase(),
            content: summary.notes[0] || "No recent activity logged.",
            isQuickLog: summary.notes[0]?.toLowerCase().includes('quick log') || false,
            timestamp: new Date(), // Placeholder as actual timestamp per note isn't in WeeklySummary
          };

          return (
            <MemoryCard 
              key={memory.id} 
              memory={memory} 
              onClick={() => router.push(`/contacts/${memory.id}`)}
            />
          );
        })}
      </div>
    </div>
  );
}
