'use client';

import React, { useState, useMemo } from 'react';
import { Search, Check } from 'lucide-react';
import { updatePersonImportance } from '@/app/actions/update-importance';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

export type TriageContact = {
  id: string;
  name: string;
  importance: 'high' | 'medium' | 'low' | null;
  status: 'healthy' | 'good' | 'warning' | 'dying';
  daysAgo: number;
  lastDate: number;
};

interface TriageListProps {
  initialContacts: TriageContact[];
}

const statusColor = {
  healthy: 'bg-emerald-500',
  good: 'bg-lime-500',
  warning: 'bg-amber-400',
  dying: 'bg-orange-500'
};

export default function TriageList({ initialContacts }: TriageListProps) {
  const [query, setQuery] = useState('');
  const [contacts, setContacts] = useState(initialContacts);
  // Track IDs that have been "planted" in this session (changed from null to a priority)
  const [plantedIds, setPlantedIds] = useState<Set<string>>(new Set());

  // Optimistic update handler
  const handleImportanceChange = async (id: string, newImportance: 'high' | 'medium' | 'low') => {
    // 1. Optimistic Update
    setContacts(prev => prev.map(c => 
      c.id === id ? { ...c, importance: newImportance } : c
    ));

    // Mark as planted if it was previously null
    const contact = contacts.find(c => c.id === id);
    if (contact && contact.importance === null) {
      setPlantedIds(prev => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
    }

    // 2. Server Action
    const result = await updatePersonImportance(id, newImportance);
    
    if (!result.success) {
      toast.error("Failed to update importance");
      // Optionally revert planted state if needed, but usually better to stay optimistic
    }
  };

  const filteredContacts = useMemo(() => {
    if (!query) return contacts;
    const lowerQ = query.toLowerCase();
    return contacts.filter(c => c.name.toLowerCase().includes(lowerQ));
  }, [contacts, query]);

  // Current unplanted count = Initial unplanted count - planted in this session
  const unplantedCount = useMemo(() => {
    const initiallyUnplantedCount = initialContacts.filter(c => c.importance === null).length;
    return Math.max(0, initiallyUnplantedCount - plantedIds.size);
  }, [initialContacts, plantedIds.size]);

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
          {unplantedCount} Unplanted Seeds
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-border-default pb-24">
        {filteredContacts.map(contact => {
          const isPlanted = plantedIds.has(contact.id);
          
          return (
            <div 
              key={contact.id}
              className={`
                py-2 px-4 flex items-center justify-between transition-all duration-300
                ${isPlanted
                  ? 'opacity-40 grayscale-[0.5] bg-subtle/50'
                  : contact.importance === 'high'
                    ? 'bg-amber-50/80 dark:bg-amber-900/10 border-l-4 border-l-amber-400'
                    : 'hover:bg-subtle border-l-4 border-l-transparent'}
              `}
            >
              <div className="flex items-center gap-4">
                {/* Status Dot or Checkmark */}
                <div className="relative">
                  <div 
                    className={`w-3 h-3 rounded-full ${statusColor[contact.status] || 'bg-border-strong'} transition-all ${isPlanted ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
                    title={`${contact.daysAgo} days ago`}
                  />
                  {isPlanted && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Check className="w-4 h-4 text-emerald-500 animate-in zoom-in duration-300" />
                    </div>
                  )}
                </div>
                
                <div>
                  <div className={cn("font-medium transition-colors", isPlanted ? "text-text-tertiary" : "text-text-primary")}>
                    {contact.name}
                    {isPlanted && <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-emerald-600/70 dark:text-emerald-500/50">Planted</span>}
                  </div>
                  <div className="text-xs text-text-tertiary">
                    {contact.daysAgo === 999 ? 'Never contacted' : `${contact.daysAgo} days ago`}
                  </div>
                </div>
              </div>

              {/* Toggle Group */}
              <div className={cn("flex rounded-lg border border-border-default bg-subtle p-1 transition-opacity", isPlanted && "pointer-events-none")}>
                <button
                  onClick={() => handleImportanceChange(contact.id, 'low')}
                  disabled={isPlanted}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                    contact.importance === "low"
                      ? "bg-surface text-text-secondary shadow-sm"
                      : "text-text-tertiary hover:text-text-secondary"
                  )}
                >
                  Casual
                </button>
                <button
                  onClick={() => handleImportanceChange(contact.id, 'medium')}
                  disabled={isPlanted}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                    contact.importance === "medium"
                      ? "bg-surface text-blue-600 shadow-sm dark:text-blue-400"
                      : "text-text-tertiary hover:text-text-secondary"
                  )}
                >
                  Medium
                </button>
                <button
                  onClick={() => handleImportanceChange(contact.id, 'high')}
                  disabled={isPlanted}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-medium transition-all ring-1",
                    contact.importance === "high"
                      ? "bg-amber-100 text-amber-700 shadow-sm ring-amber-200 dark:bg-amber-900/40 dark:text-amber-400 dark:ring-amber-800"
                      : "text-text-tertiary hover:text-text-secondary"
                  )}
                >
                  High
                </button>
              </div>
            </div>
          );
        })}

        {filteredContacts.length === 0 && (
          <div className="p-12 text-center text-text-tertiary">
            No contacts found matching &quot;{query}&quot;
          </div>
        )}
      </div>
    </div>
  );
}
