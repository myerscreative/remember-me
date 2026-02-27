'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, MessageSquarePlus, CalendarDays, AlertTriangle } from 'lucide-react';
import { NetworkContact, NetworkData } from './NetworkDataService';
import { getRelationshipStatus } from '../utils/relationshipStatus';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogInteractionModal } from './LogInteractionModal';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';

interface NetworkNurtureViewProps {
  data: NetworkData;
  onBack: () => void;
}

type HealthCategory = 'neglected' | 'drifting';

interface CategorizedContact {
  contact: NetworkContact;
  category: HealthCategory;
  label: string;
  daysAgo: number;
}

export function NetworkNurtureView({ data, onBack }: NetworkNurtureViewProps) {
  const [logContact, setLogContact] = useState<NetworkContact | null>(null);

  // Filter and categorize contacts
  const categorized = useMemo(() => {
    const results: CategorizedContact[] = [];

    data.contacts.forEach(contact => {
      const status = getRelationshipStatus(contact);

      // Check for drifting (amber) or neglected (red) based on the colorClass
      if (status.colorClass.includes('text-red-')) {
        const daysAgo = getDaysAgo(contact);
        results.push({ contact, category: 'neglected', label: status.label, daysAgo });
      } else if (status.colorClass.includes('text-amber-')) {
        const daysAgo = getDaysAgo(contact);
        results.push({ contact, category: 'drifting', label: status.label, daysAgo });
      }
    });

    // Sort: neglected first (most urgent), then drifting, within each group by days ago descending
    results.sort((a, b) => {
      if (a.category !== b.category) return a.category === 'neglected' ? -1 : 1;
      return b.daysAgo - a.daysAgo;
    });

    return results;
  }, [data.contacts]);

  const neglectedCount = categorized.filter(c => c.category === 'neglected').length;
  const driftingCount = categorized.filter(c => c.category === 'drifting').length;

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
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-white">Nurture Connections</h2>
          <p className="text-sm text-slate-400">Relationships that need your attention</p>
        </div>
      </div>

      {/* Summary Badges */}
      {categorized.length > 0 && (
        <div className="flex gap-3 max-w-2xl mx-auto">
          {neglectedCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
              <AlertTriangle className="w-4 h-4" />
              {neglectedCount} Neglected
            </div>
          )}
          {driftingCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium">
              <Heart className="w-4 h-4" />
              {driftingCount} Drifting
            </div>
          )}
        </div>
      )}

      {/* Contact List */}
      <div className="space-y-2 max-w-2xl mx-auto pb-20">
        {categorized.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="w-10 h-10 text-emerald-500/50 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">Your garden is flourishing!</p>
            <p className="text-sm text-slate-500 mt-1">No drifting or neglected connections right now.</p>
          </div>
        ) : (
          categorized.map(({ contact, category, daysAgo }, i) => {
            const initials = (contact.first_name?.[0] || '') + (contact.last_name?.[0] || '');
            const lastDate = contact.last_interaction_date
              ? format(parseISO(contact.last_interaction_date), 'MMM d')
              : 'Never';

            return (
              <motion.div
                key={contact.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border transition-all",
                  category === 'neglected'
                    ? "bg-red-500/5 border-red-500/15 hover:border-red-500/30"
                    : "bg-amber-500/5 border-amber-500/15 hover:border-amber-500/30"
                )}
              >
                {/* Avatar with health dot */}
                <Link href={`/contacts/${contact.id}`} className="shrink-0 relative">
                  <Avatar className="h-10 w-10 border-2 border-slate-700">
                    <AvatarImage src={contact.photo_url || undefined} />
                    <AvatarFallback className="bg-slate-800 text-slate-300 text-xs font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className={cn(
                    "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-950",
                    category === 'neglected' ? 'bg-red-500' : 'bg-amber-500'
                  )} />
                </Link>

                {/* Info */}
                <Link href={`/contacts/${contact.id}`} className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{contact.name}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <CalendarDays className="w-3 h-3" />
                    <span>{lastDate}</span>
                    <span className="text-slate-600">·</span>
                    <span className={cn(
                      "font-medium",
                      category === 'neglected' ? 'text-red-400' : 'text-amber-400'
                    )}>
                      {daysAgo}d ago
                    </span>
                  </div>
                </Link>

                {/* Quick Action: Log Interaction */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setLogContact(contact);
                  }}
                  className={cn(
                    "shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all",
                    category === 'neglected'
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30"
                      : "bg-emerald-600/80 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/20"
                  )}
                >
                  <MessageSquarePlus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Log</span>
                </button>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Log Interaction Modal */}
      {logContact && (
        <LogInteractionModal
          isOpen={!!logContact}
          onClose={() => setLogContact(null)}
          tribe={{
            id: logContact.id,
            name: logContact.name,
            domainId: 'nurture',
            memberCount: 1,
            members: [logContact]
          }}
        />
      )}
    </motion.div>
  );
}

function getDaysAgo(contact: NetworkContact): number {
  const lastStr = contact.last_interaction_date || contact.last_contact;
  if (!lastStr) return 999;
  const last = new Date(lastStr);
  const now = new Date();
  return Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
}
