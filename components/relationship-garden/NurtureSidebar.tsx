'use client';

import React, { useMemo } from 'react';
import { Zap, Clock } from 'lucide-react';
import { Contact } from './RelationshipGarden';

interface NurtureSidebarProps {
  contacts: Contact[];
  onQuickLog: (contact: Contact) => void;
  onHover?: (contactId: string | null) => void;
}

export default function NurtureSidebar({ contacts, onQuickLog, onHover }: NurtureSidebarProps) {
  // Filter for High Importance + Fading (Needs Love)
  // Fading is generally > 45 days
  const nurtureList = useMemo(() => {
    return contacts
      .filter(c => {
        // 1. Never Contacted
        if (c.days >= 999) return true;
        // 2. High Importance slipping away (> 14 days)
        if (c.importance === 'high' && c.days > 14) return true;
        // 3. General Neglect (> 30 days)
        if (c.days > 30) return true;
        
        return false;
      })
      .sort((a, b) => {
        // Sort by "Needs Attention Score" approx
        // Prioritize High Importance
        if (a.importance === 'high' && b.importance !== 'high') return -1;
        if (a.importance !== 'high' && b.importance === 'high') return 1;
        
        // Then by days overdue (descending)
        return b.days - a.days;
      }) 
      .slice(0, 10);
  }, [contacts]);

  // No empty check return null here -> we want to render the empty state if needed
  // But strictly per instructions: "If all High-Importance contacts are Blooming, show a celebratory message"
  // So we render the container regardless.

  return (
    <div className="w-full lg:w-80 shrink-0 flex flex-col gap-4 z-10 h-[600px] max-h-[80vh]">
      <div className="bg-surface/90 backdrop-blur border border-border-default p-4 rounded-2xl shadow-xl flex flex-col h-full">
        <div className="flex items-center justify-between mb-3 shrink-0">
          <h3 className="font-bold text-text-primary flex items-center gap-2">
             🍂 Needs Nurture
          </h3>
          {nurtureList.length > 0 && (
            <span className="text-xs font-medium text-text-tertiary bg-subtle px-2 py-1 rounded-full">
              Top {nurtureList.length}
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
          {nurtureList.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4 text-text-tertiary">
              <span className="text-4xl mb-3">🌿</span>
              <p className="text-sm font-medium">All core connections are nourished!</p>
            </div>
          ) : (
            nurtureList.map(contact => (
              <div 
                key={contact.id}
                onPointerEnter={() => onHover?.(contact.id.toString())}
                onPointerLeave={() => onHover?.(null)}
                className="group flex items-center justify-between p-2.5 bg-surface rounded-xl border border-border-default hover:border-orange-200 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative shrink-0">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-xs font-bold border border-orange-200 shadow-[0_0_10px_-2px_rgba(249,115,22,0.3)]">
                      {contact.initials}
                    </div>
                    {/* Status dot */}
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-orange-500 border-2 border-surface"></div>
                  </div>
                  
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-text-primary truncate">
                      {contact.name}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-100 text-orange-700 uppercase tracking-wide">
                        Fading
                      </span>
                      <span className="text-[10px] text-text-tertiary flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {contact.days}d
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onQuickLog(contact)}
                  className="shrink-0 p-1.5 rounded-lg bg-surface text-text-tertiary hover:text-emerald-600 hover:bg-emerald-50 border border-border-default hover:border-emerald-200 transition-all shadow-sm"
                  title="Quick Log Connection"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
