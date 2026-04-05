'use client';

import React, { useState, useMemo } from 'react';
import { Search, Check, Send, Loader2 } from 'lucide-react';
import { updateContact } from '@/app/actions/update-contact';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export type TriageContact = {
  id: string;
  name: string;
  importance: 'high' | 'medium' | 'low' | null;
  status: 'healthy' | 'good' | 'warning' | 'dying';
  daysAgo: number;
  lastDate: number;
  notes?: string | null;
};

interface TriageEnrichmentListProps {
  initialContacts: TriageContact[];
}

export default function TriageEnrichmentList({ initialContacts }: TriageEnrichmentListProps) {
  const [query, setQuery] = useState('');
  const [contacts] = useState(initialContacts);
  const [enrichedIds, setEnrichedIds] = useState<Set<string>>(new Set());
  const [savingId, setSavingId] = useState<string | null>(null);
  const [notesInputs, setNotesInputs] = useState<Record<string, string>>({});

  const handleNoteChange = (id: string, value: string) => {
    setNotesInputs(prev => ({ ...prev, [id]: value }));
  };

  const handleSaveNote = async (id: string) => {
    const note = notesInputs[id];
    if (!note?.trim()) return;

    setSavingId(id);
    
    // 1. Server Action
    const result = await updateContact(id, { notes: note, has_context: true });
    
    if (result.success) {
      setEnrichedIds(prev => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
      toast.success("Context added!");
    } else {
      toast.error("Failed to add context");
    }
    
    setSavingId(null);
  };

  const filteredContacts = useMemo(() => {
    if (!query) return contacts;
    const lowerQ = query.toLowerCase();
    return contacts.filter(c => c.name.toLowerCase().includes(lowerQ));
  }, [contacts, query]);

  const enrichmentNeededCount = useMemo(() => {
    return Math.max(0, initialContacts.length - enrichedIds.size);
  }, [initialContacts.length, enrichedIds.size]);

  return (
    <div>
      {/* Toolbar */}
      <div className="p-4 border-b border-border-default bg-subtle/50 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search contacts..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-border-default bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 transition-all placeholder:text-text-tertiary text-text-primary"
          />
        </div>
        <div className="text-sm font-medium text-text-tertiary whitespace-nowrap">
          {enrichmentNeededCount} Needing Context
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-border-default pb-24">
        {filteredContacts.map(contact => {
          const isEnriched = enrichedIds.has(contact.id);
          const isSaving = savingId === contact.id;
          const noteValue = notesInputs[contact.id] ?? contact.notes ?? '';
          
          return (
            <div 
              key={contact.id}
              className={`
                py-4 px-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300
                ${isEnriched
                  ? 'opacity-40 grayscale-[0.5] bg-subtle/50'
                  : 'hover:bg-subtle'}
              `}
            >
              <div className="flex items-center gap-4 min-w-[200px]">
                <div className="relative">
                  {isEnriched ? (
                    <Check className="w-5 h-5 text-emerald-500 animate-in zoom-in duration-300" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-subtle flex items-center justify-center text-text-tertiary font-bold">
                      {contact.name.charAt(0)}
                    </div>
                  )}
                </div>
                
                <div>
                  <div className={cn("font-medium transition-colors", isEnriched ? "text-text-tertiary" : "text-text-primary")}>
                    {contact.name}
                  </div>
                  <div className="text-xs text-text-tertiary">
                    {contact.daysAgo === 999 ? 'Never contacted' : `${contact.daysAgo} days ago`}
                  </div>
                </div>
              </div>

              {/* Context Entry Field */}
              <div className="flex-1 flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Add a quick note or where you met..."
                    value={noteValue}
                    onChange={(e) => handleNoteChange(contact.id, e.target.value)}
                    disabled={isEnriched || isSaving}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveNote(contact.id)}
                    className="w-full px-4 py-2 rounded-lg border border-border-default bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 transition-all placeholder:text-text-tertiary text-text-primary disabled:opacity-50"
                  />
                </div>
                <button
                  onClick={() => handleSaveNote(contact.id)}
                  disabled={isEnriched || isSaving || !noteValue.trim()}
                  className={`
                    p-2 rounded-lg transition-all
                    ${isEnriched 
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' 
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm disabled:opacity-30'}
                  `}
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isEnriched ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          );
        })}

        {filteredContacts.length === 0 && (
          <div className="p-12 text-center text-text-tertiary">
            {initialContacts.length === 0 ? (
               <div className="space-y-4">
                 <p className="text-lg font-medium text-text-primary">All your seeds have context!</p>
                 <p className="text-sm max-w-xs mx-auto text-text-tertiary">
                   Every contact has enough information for the AI to flourish.
                 </p>
               </div>
            ) : (
              `No contacts found matching &quot;${query}&quot;`
            )}
          </div>
        )}
      </div>
    </div>
  );
}
