'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowLeft, Filter, Eye, EyeOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  ContactHealth, 
  TreeHealthStatus, 
  ContactCategory,
  ContactHealth as ContactHealthType,
} from './types';
import { 
  calculateDaysSince, 
  calculateTreeHealth, 
  calculateTreeStats 
} from './utils/treeHealthUtils';
import { useGameData, GameContact } from '@/hooks/useGameData';

const treeLoading = () => (
  <div className="flex items-center justify-center min-h-[400px] text-text-tertiary">
    <Loader2 className="h-8 w-8 animate-spin" />
  </div>
);

const RelationshipTree = dynamic(() => import('./components/RelationshipTree').then((m) => m.default), {
  ssr: false,
  loading: treeLoading,
});

const TreeStatsPanel = dynamic(() => import('./components/TreeStats').then((m) => m.default), {
  ssr: false,
  loading: () => <div className="h-32 animate-pulse rounded-xl bg-subtle" />,
});

const TreeFilters = dynamic(() => import('./components/TreeFilters').then((m) => m.default), {
  ssr: false,
  loading: () => <div className="h-24 animate-pulse rounded-xl bg-subtle" />,
});

const ActionPanel = dynamic(() => import('./components/ActionPanel').then((m) => m.default), {
  ssr: false,
  loading: () => <div className="h-40 animate-pulse rounded-xl bg-subtle" />,
});

// Mock data transformer - adapted for Real Data
function transformContactsToTreeFormat(contacts: GameContact[]): ContactHealth[] {
  return contacts.map(contact => {
    const daysAgo = calculateDaysSince(contact.lastContactDate || undefined);
    const healthStatus = calculateTreeHealth(daysAgo);
    
    // Infer category from tags (simplified logic)
    let category: ContactCategory = 'friends';
    if (contact.tags.some(t => t.toLowerCase().includes('work'))) category = 'work';
    else if (contact.tags.some(t => t.toLowerCase().includes('family'))) category = 'family';
    else if (contact.tags.some(t => t.toLowerCase().includes('client'))) category = 'clients';
    else if (contact.tags.some(t => t.toLowerCase().includes('mentor') || t.toLowerCase().includes('network'))) category = 'networking';
    
    return {
      contactId: String(contact.id),
      name: contact.name,
      initials: contact.initials,
      photoUrl: contact.photo_url || null,
      lastContactDate: contact.lastContactDate ? new Date(contact.lastContactDate) : null,
      daysAgo,
      healthStatus,
      category,
      position: { x: 0, y: 0 }, // Will be positioned by the tree
      email: '', // Not in GameContact yet, add if needed or optional
      phone: '', 
      sharedMemory: contact.ai_summary, // AI Synopsis for Quick Briefing
      isAnniversary: (contact.milestones || []).some((m: any) => {
         // Check for Anniversary in title/type
         if (!/anniversary/i.test(m.title || '') && !/anniversary/i.test(m.type || '')) return false;
         
         // Check if within next 7 days (ignoring year, assuming recurring)
         const date = new Date(m.date);
         const now = new Date();
         const currentYearDate = new Date(now.getFullYear(), date.getMonth(), date.getDate());
         
         // Handle if date has passed this year, check next year? 
         // For "Gold Ring", we only care if it's THIS week.
         // If today is Dec 31 and anniv is Jan 1, we need to handle year wrap.
         // Simpler: Just check difference in days from now.
         const diffTime = currentYearDate.getTime() - now.getTime();
         const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
         
         return diffDays >= -1 && diffDays <= 7; // -1 to handle "today" broadly or timezone edge cases
      })
    };
  });
}

export default function RelationshipTreePage() {
  const { contacts, loading } = useGameData();

  const [showFilters, setShowFilters] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [healthFilters, setHealthFilters] = useState<TreeHealthStatus[]>([]);
  const [categoryFilters, setCategoryFilters] = useState<ContactCategory[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string | undefined>();

  // Transform real contacts to tree format
  const treeContacts = useMemo(() => {
    if (loading) return [];
    return transformContactsToTreeFormat(contacts);
  }, [contacts, loading]);

  // Calculate stats
  const stats = useMemo(() => {
    return calculateTreeStats(treeContacts);
  }, [treeContacts]);

  // Filter contacts needing attention (warning, dying, dormant)
  const contactsNeedingAttention = useMemo(() => {
    return treeContacts.filter(c => 
      c.healthStatus === 'warning' || 
      c.healthStatus === 'dying' || 
      c.healthStatus === 'dormant'
    );
  }, [treeContacts]);

  const handleContactClick = (contact: ContactHealthType) => {
    setSelectedContactId(contact.contactId);
    // In production, this would open a contact details drawer/modal
  };

  const handleWaterContact = (contact: ContactHealthType) => {
    // In production, this would open a message composer or log interaction
    alert(`Reaching out to ${contact.name}...`);
  };

  const handleWaterAll = () => {
    // In production, this would open a batch message modal
    alert(`Preparing to reach out to ${contactsNeedingAttention.length} contacts...`);
  };

  const handleClearFilters = () => {
    setHealthFilters([]);
    setCategoryFilters([]);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-amber-50 via-white to-green-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-lg border-b border-border-default">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link 
              href="/" 
              className="p-2 hover:bg-subtle rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-text-secondary" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
                🌳 Relationship Tree
              </h1>
              <p className="text-sm text-text-tertiary">
                Visualize your network health
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowLabels(!showLabels)}
              className={cn("rounded-lg p-2 transition-colors", showLabels ? "bg-indigo-100 text-indigo-600" : "text-text-secondary hover:bg-subtle")}
              title={showLabels ? 'Hide labels' : 'Show labels'}
            >
              {showLabels ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn("rounded-lg p-2 transition-colors", showFilters ? "bg-indigo-100 text-indigo-600" : "text-text-secondary hover:bg-subtle")}
              title="Toggle filters"
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tree visualization */}
          <div className="lg:col-span-2">
            <div className="bg-surface rounded-2xl shadow-lg overflow-hidden">
              <RelationshipTree
                contacts={treeContacts}
                onContactClick={handleContactClick}
                selectedContactId={selectedContactId}
                healthFilter={healthFilters}
                categoryFilter={categoryFilters}
                showLabels={showLabels}
                className="w-full"
              />
            </div>
          </div>

          {/* Side panels */}
          <div className="space-y-6">
            {/* Filters (collapsible on mobile) */}
            {showFilters && (
              <TreeFilters
                activeHealthFilters={healthFilters}
                activeCategoryFilters={categoryFilters}
                onHealthFilterChange={setHealthFilters}
                onCategoryFilterChange={setCategoryFilters}
                onClearAll={handleClearFilters}
              />
            )}

            {/* Stats panel */}
            <TreeStatsPanel stats={stats} />

            {/* Action panel */}
            <ActionPanel
              contactsNeedingAttention={contactsNeedingAttention}
              onWaterContact={handleWaterContact}
              onWaterAll={handleWaterAll}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
