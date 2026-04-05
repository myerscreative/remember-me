'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Clock, Star, ArrowLeft, X, Loader2 } from 'lucide-react';
import { NetworkContact, SubTribe, NetworkData } from './NetworkDataService';
import { TribeView } from './TribeView';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { addContact } from '@/app/actions/add-contact';
import { toast } from 'sonner';

interface NetworkSearchViewProps {
  data: NetworkData;
  onBack: () => void;
  onNurtureTribe: (tribe: SubTribe) => void;
  onContactAdded?: () => void;
  initialSearchTerm?: string;
}

const RECENTLY_VIEWED_KEY = 'remember-me-recently-viewed';

function getRecentlyViewed(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || '[]');
  } catch {
    return [];
  }
}

export function NetworkSearchView({ data, onBack, onNurtureTribe, onContactAdded, initialSearchTerm = '' }: NetworkSearchViewProps) {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [debouncedTerm, setDebouncedTerm] = useState(initialSearchTerm);
  const [isPlanting, setIsPlanting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 150);
  }, []);

  // Debounce
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedTerm(searchTerm.trim()), 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Recently viewed contacts
  const recentContacts = useMemo(() => {
    const ids = getRecentlyViewed();
    return ids
      .map(id => data.contacts.find(c => c.id === id))
      .filter(Boolean)
      .slice(0, 5) as NetworkContact[];
  }, [data.contacts]);

  // Frequent contacts — sorted by interactions count (using last_interaction_date as proxy)
  const frequentContacts = useMemo(() => {
    return [...data.contacts]
      .filter(c => c.last_interaction_date)
      .sort((a, b) => {
        const dateA = a.last_interaction_date ? new Date(a.last_interaction_date).getTime() : 0;
        const dateB = b.last_interaction_date ? new Date(b.last_interaction_date).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 5);
  }, [data.contacts]);

  // Search results
  const searchResults = useMemo(() => {
    if (!debouncedTerm) return [];
    const term = debouncedTerm.toLowerCase();
    const matching = data.contacts.filter(c =>
      c.name.toLowerCase().includes(term) ||
      (c.where_met && c.where_met.toLowerCase().includes(term)) ||
      (c.interests && c.interests.some(i => i.toLowerCase().includes(term))) ||
      (c.tags && c.tags.some(t => t.toLowerCase().includes(term)))
    );
    if (matching.length === 0) return [];
    const tribe: SubTribe = {
      id: 'search-results',
      name: `Results for "${debouncedTerm}"`,
      domainId: 'search',
      memberCount: matching.length,
      members: matching
    };
    return [tribe];
  }, [debouncedTerm, data.contacts]);

  const [activeChip, setActiveChip] = useState<'recent' | 'frequent' | null>(null);

  const showQuickAddCTA = debouncedTerm.length >= 3 && searchResults.length === 0;

  const handlePlantSeed = async () => {
    if (!debouncedTerm.trim() || isPlanting) return;
    setIsPlanting(true);
    try {
      const result = await addContact(debouncedTerm.trim());
      if (result.success) {
        toast.success('Seed planted!', {
          description: `Added ${debouncedTerm.trim()} to your garden.`
        });
        setSearchTerm('');
        setDebouncedTerm('');
        onContactAdded?.();
      } else {
        toast.error('Failed to add contact', {
          description: result.error
        });
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setIsPlanting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-subtle transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold text-text-primary">Search & Filter</h2>
      </div>

      {/* Search Input */}
      <div className="relative max-w-xl mx-auto">
        <input
          ref={inputRef}
          type="text"
          placeholder="Search by name, interest, tag, location..."
          className="w-full pl-11 pr-10 py-3 rounded-xl border border-border-default bg-canvas text-text-primary placeholder-text-secondary focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <Search className="absolute left-3.5 top-3.5 w-5 h-5 text-text-secondary" />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-3 p-0.5 text-text-secondary hover:text-text-primary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Quick Chips */}
      {!debouncedTerm && (
        <div className="max-w-xl mx-auto space-y-4">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveChip(activeChip === 'recent' ? null : 'recent')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                activeChip === 'recent'
                  ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
                  : 'bg-subtle/50 border-border-default text-text-secondary hover:text-text-primary hover:border-border-strong'
              }`}
            >
              <Clock className="w-4 h-4" />
              Recently Viewed
            </button>
            <button
              onClick={() => setActiveChip(activeChip === 'frequent' ? null : 'frequent')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                activeChip === 'frequent'
                  ? 'bg-amber-600/20 border-amber-500/40 text-amber-300'
                  : 'bg-subtle/50 border-border-default text-text-secondary hover:text-text-primary hover:border-border-strong'
              }`}
            >
              <Star className="w-4 h-4" />
              Frequent Contacts
            </button>
          </div>

          {/* Chip Results */}
          {activeChip && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              {(activeChip === 'recent' ? recentContacts : frequentContacts).length === 0 ? (
                <p className="text-sm text-text-secondary py-4 text-center">
                  {activeChip === 'recent'
                    ? 'No recently viewed contacts yet.'
                    : 'No frequent contacts found.'}
                </p>
              ) : (
                (activeChip === 'recent' ? recentContacts : frequentContacts).map(contact => (
                  <Link
                    key={contact.id}
                    href={`/contacts/${contact.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl bg-subtle/50 border border-border-default/50 hover:bg-subtle hover:border-border-strong transition-all group"
                  >
                    <Avatar className="h-9 w-9 border border-border-strong">
                      <AvatarImage src={contact.photo_url || undefined} alt={contact.name} />
                      <AvatarFallback className="bg-indigo-900 text-indigo-300 text-xs font-bold">
                        {(contact.first_name?.[0] || '') + (contact.last_name?.[0] || '')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate group-hover:text-indigo-300 transition-colors">
                        {contact.name}
                      </p>
                      {contact.where_met && (
                        <p className="text-xs text-text-secondary truncate">{contact.where_met}</p>
                      )}
                    </div>
                  </Link>
                ))
              )}
            </motion.div>
          )}
        </div>
      )}

      {/* Search Results */}
      {debouncedTerm && (
        <>
          {showQuickAddCTA ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-4 p-4 rounded-xl border border-border-default bg-surface/50"
            >
              <p className="text-sm text-text-secondary text-center">
                No one named &quot;{debouncedTerm}&quot; in your garden yet.
              </p>
              <Button
                onClick={handlePlantSeed}
                disabled={isPlanting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl min-h-11"
              >
                {isPlanting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  `Plant Seed for ${debouncedTerm}`
                )}
              </Button>
            </motion.div>
          ) : (
            <TribeView
              tribes={searchResults}
              searchTerm={debouncedTerm}
              onNurtureTribe={onNurtureTribe}
            />
          )}
        </>
      )}
    </motion.div>
  );
}
