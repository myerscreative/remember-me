'use client';

import React, { useEffect, useState } from 'react';
import { getCriticalDrifters, Drifter } from '@/lib/dashboard/getDrifters';
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
             className="w-full bg-canvas/40 border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-amber-500/30 group/nudge"
          >
             <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="relative">
                  <div className="absolute -inset-1 rounded-full bg-amber-500/20 blur-[2px] opacity-0 group-hover/nudge:opacity-100 transition-opacity duration-500" />
                  <Avatar className="h-10 w-10 border border-white/10 shadow-lg relative">
                      <AvatarImage src={drifter.photo_url || undefined} alt={drifter.name} />
                      <AvatarFallback className="bg-elevated text-amber-500 font-black">
                          {getInitialsFromFullName(drifter.name)}
                      </AvatarFallback>
                  </Avatar>
                </div>
                <div>
                    <h4 className="font-black text-text-primary text-sm tracking-tight">{drifter.name}</h4>
                    <p className="text-[10px] font-black text-amber-500/90 uppercase tracking-widest">
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
                className="w-full sm:w-auto bg-white/5 hover:bg-amber-500/20 border border-white/5 hover:border-amber-500/40 text-text-tertiary hover:text-white font-black text-xs h-9 shadow-lg px-6 shrink-0 transition-all duration-300 active:scale-95 group/btn"
             >
                <Zap className="w-3.5 h-3.5 mr-2 text-amber-500 group-hover/btn:animate-pulse" />
                NUDGE
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
