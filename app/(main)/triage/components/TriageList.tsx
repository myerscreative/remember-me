'use client';

import React, { useState, useMemo } from 'react';
import { Search, Check } from 'lucide-react';
import { updatePersonImportance } from '@/app/actions/update-importance';
import toast from 'react-hot-toast';

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
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search contacts..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-600 transition-all placeholder:text-slate-400 dark:text-white"
          />
        </div>
        <div className="text-sm font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
          {unplantedCount} Unplanted Seeds
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800 pb-24">
        {filteredContacts.map(contact => {
          const isPlanted = plantedIds.has(contact.id);
          
          return (
            <div 
              key={contact.id}
              className={`
                py-2 px-4 flex items-center justify-between transition-all duration-300
                ${isPlanted 
                  ? 'opacity-40 grayscale-[0.5] bg-slate-50/50 dark:bg-slate-800/30' 
                  : contact.importance === 'high' 
                    ? 'bg-amber-50/80 dark:bg-amber-900/10 border-l-4 border-l-amber-400' 
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border-l-4 border-l-transparent'}
              `}
            >
              <div className="flex items-center gap-4">
                {/* Status Dot or Checkmark */}
                <div className="relative">
                  <div 
                    className={`w-3 h-3 rounded-full ${statusColor[contact.status] || 'bg-slate-300'} transition-all ${isPlanted ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
                    title={`${contact.daysAgo} days ago`}
                  />
                  {isPlanted && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Check className="w-4 h-4 text-emerald-500 animate-in zoom-in duration-300" />
                    </div>
                  )}
                </div>
                
                <div>
                  <div className={`font-medium transition-colors ${isPlanted ? 'text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'}`}>
                    {contact.name}
                    {isPlanted && <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-emerald-600/70 dark:text-emerald-500/50">Planted</span>}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {contact.daysAgo === 999 ? 'Never contacted' : `${contact.daysAgo} days ago`}
                  </div>
                </div>
              </div>

              {/* Toggle Group */}
              <div className={`flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700 transition-opacity ${isPlanted ? 'pointer-events-none' : ''}`}>
                <button
                  onClick={() => handleImportanceChange(contact.id, 'low')}
                  disabled={isPlanted}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    contact.importance === 'low'
                      ? 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  Casual
                </button>
                <button
                  onClick={() => handleImportanceChange(contact.id, 'medium')}
                  disabled={isPlanted}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    contact.importance === 'medium'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  Medium
                </button>
                <button
                  onClick={() => handleImportanceChange(contact.id, 'high')}
                  disabled={isPlanted}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    contact.importance === 'high'
                      ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 shadow-sm ring-1 ring-amber-200 dark:ring-amber-800'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  High
                </button>
              </div>
            </div>
          );
        })}

        {filteredContacts.length === 0 && (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            No contacts found matching &quot;{query}&quot;
          </div>
        )}
      </div>
    </div>
  );
}
