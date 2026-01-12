'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Filter, Eye, EyeOff } from 'lucide-react';
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
import RelationshipTree from './components/RelationshipTree';
import TreeStatsPanel from './components/TreeStats';
import TreeFilters from './components/TreeFilters';
import ActionPanel from './components/ActionPanel';

import { useGameData, GameContact } from '@/hooks/useGameData';

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
    console.log('Selected contact:', contact.name);
  };

  const handleWaterContact = (contact: ContactHealthType) => {
    // In production, this would open a message composer or log interaction
    console.log('Watering contact:', contact.name);
    alert(`Reaching out to ${contact.name}...`);
  };

  const handleWaterAll = () => {
    // In production, this would open a batch message modal
    console.log('Watering all contacts needing attention');
    alert(`Preparing to reach out to ${contactsNeedingAttention.length} contacts...`);
  };

  const handleClearFilters = () => {
    setHealthFilters([]);
    setCategoryFilters([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-green-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link 
              href="/" 
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                🌳 Relationship Tree
              </h1>
              <p className="text-sm text-gray-500">
                Visualize your network health
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowLabels(!showLabels)}
              className={`p-2 rounded-lg transition-colors ${showLabels ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100 text-gray-600'}`}
              title={showLabels ? 'Hide labels' : 'Show labels'}
            >
              {showLabels ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${showFilters ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100 text-gray-600'}`}
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
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
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
