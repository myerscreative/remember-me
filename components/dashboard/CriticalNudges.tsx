'use client';

import React, { useEffect, useState } from 'react';
import { getCriticalDrifters, Drifter } from '@/lib/dashboard/getDrifters';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Zap } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitialsFromFullName } from '@/lib/utils/contact-helpers';
import { ReachOutPanel } from '@/components/contacts/ReachOutPanel';

export function CriticalNudges() {
  const [drifters, setDrifters] = useState<Drifter[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDrifter, setSelectedDrifter] = useState<Drifter | null>(null);

  useEffect(() => {
    async function load() {
      const { data } = await getCriticalDrifters();
      setDrifters(data || []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading || drifters.length === 0) return null;

  return (
    <div className="space-y-4 mb-6 animate-in slide-in-from-top-4 duration-500">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
            <AlertCircle className="w-3 h-3 text-amber-500" />
            Urgent: Nudge these Shared Memories today
        </h3>
      </div>

      <div className="flex flex-col w-full gap-3">
        {drifters.slice(0, 3).map((drifter) => (
          <div 
             key={drifter.id} 
             className="w-full bg-amber-50 border border-amber-200/60 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm"
          >
             <div className="flex items-center gap-3 w-full sm:w-auto">
                <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                    <AvatarImage src={drifter.photo_url || undefined} />
                    <AvatarFallback className="bg-amber-100 text-amber-700 font-bold">
                        {getInitialsFromFullName(drifter.name)}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <h4 className="font-bold text-slate-800 text-sm">{drifter.name}</h4>
                    <p className="text-[11px] font-medium text-amber-600/80 uppercase tracking-wide">
                        {drifter.days_overdue > 0 
                            ? `Overdue by ${drifter.days_overdue} day${drifter.days_overdue > 1 ? 's' : ''}` 
                            : 'Drifting away today'
                        }
                    </p>
                </div>
             </div>

             <Button 
                size="sm"
                onClick={() => setSelectedDrifter(drifter)}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-9 shadow-sm px-4 shrink-0 transition-all hover:scale-105"
             >
                <Zap className="w-3 h-3 mr-2" />
                Nudge
             </Button>
          </div>
        ))}
      </div>

      {selectedDrifter && (
        <ReachOutPanel
            isOpen={!!selectedDrifter}
            onClose={() => setSelectedDrifter(null)}
            contact={{
                name: selectedDrifter.name,
                deep_lore: selectedDrifter.deep_lore,
                why_stay_in_contact: selectedDrifter.why_stay_in_contact,
                shared_memories: selectedDrifter.shared_memories,
                relationship_summary: selectedDrifter.relationship_summary,
                ai_summary: selectedDrifter.ai_summary,
                where_met: selectedDrifter.where_met
            }}
        />
      )}
    </div>
  );
}
