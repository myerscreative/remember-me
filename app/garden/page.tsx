
'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import RelationshipGarden, { Contact } from '@/components/relationship-garden/RelationshipGarden';
import CategoryFilters, { FilterType } from '@/components/relationship-garden/CategoryFilters';
import GardenStats from '@/components/relationship-garden/GardenStats';

// Mock Data
const MOCK_CONTACTS: Contact[] = [
  { id: 1, initials: 'SC', name: 'Sarah Chen', days: 3, category: 'work' },
  { id: 2, initials: 'MJ', name: 'Mike Johnson', days: 5, category: 'friends' },
  { id: 3, initials: 'TH', name: 'Tom Hall', days: 7, category: 'work' },
  { id: 4, initials: 'JM', name: 'Jennifer Martinez', days: 10, category: 'family' },
  { id: 5, initials: 'DK', name: 'David Kim', days: 12, category: 'work' },
  { id: 6, initials: 'EB', name: 'Emily Brown', days: 6, category: 'friends' },
  { id: 7, initials: 'JW', name: 'James Wilson', days: 15, category: 'clients' },
  { id: 8, initials: 'LA', name: 'Lisa Anderson', days: 18, category: 'friends' },
  { id: 9, initials: 'RW', name: 'Robert Williams', days: 4, category: 'family' },
  { id: 10, initials: 'KS', name: 'Kate Smith', days: 8, category: 'work' },
  { id: 11, initials: 'BT', name: 'Brian Taylor', days: 20, category: 'friends' },
  { id: 12, initials: 'NC', name: 'Nancy Clark', days: 25, category: 'networking' },
  { id: 13, initials: 'AF', name: 'Andrew Foster', days: 9, category: 'work' },
  { id: 14, initials: 'PL', name: 'Patricia Lee', days: 35, category: 'clients' },
  { id: 15, initials: 'GM', name: 'George Miller', days: 11, category: 'family' },
  { id: 16, initials: 'ZX', name: 'Zoe Xu', days: 6, category: 'friends' },
  { id: 17, initials: 'YT', name: 'Yuki Tanaka', days: 13, category: 'work' },
  { id: 18, initials: 'WQ', name: 'Wei Qian', days: 7, category: 'family' },
  { id: 19, initials: 'VN', name: 'Victor Ng', days: 28, category: 'networking' },
  { id: 20, initials: 'UM', name: 'Uma Martin', days: 5, category: 'friends' },
  { id: 21, initials: 'TG', name: 'Tom Green', days: 14, category: 'work' },
  { id: 22, initials: 'SP', name: 'Sofia Patel', days: 22, category: 'clients' },
  { id: 23, initials: 'KL', name: 'Kevin Lee', days: 2, category: 'family' },
  { id: 24, initials: 'MR', name: 'Maria Rodriguez', days: 16, category: 'friends' },
  { id: 25, initials: 'JD', name: 'John Davis', days: 40, category: 'work' },
  { id: 26, initials: 'AR', name: 'Amy Roberts', days: 19, category: 'family' },
  { id: 27, initials: 'BC', name: 'Bob Cooper', days: 8, category: 'work' },
  { id: 28, initials: 'LT', name: 'Linda Turner', days: 30, category: 'clients' },
  { id: 29, initials: 'PH', name: 'Paul Harris', days: 12, category: 'friends' },
  { id: 30, initials: 'EJ', name: 'Emma Jones', days: 4, category: 'work' },
];

export default function GardenPage() {
  const [filter, setFilter] = useState<FilterType>('all');

  // Calculate filtered stats
  const stats = useMemo(() => {
    // Stats apply to the CURRENT view or ALL contacts? 
    // Usually header stats show overall health, or filtered health.
    // Prototype: "Update stats... filteredContacts"
    // So stats reflect the current filter.
    const currentContacts = filter === 'all' 
      ? MOCK_CONTACTS 
      : MOCK_CONTACTS.filter(c => c.category === filter);

    const s = { healthy: 0, good: 0, warning: 0, dying: 0 };
    currentContacts.forEach(c => {
      if (c.days <= 7) s.healthy++;
      else if (c.days <= 21) s.good++;
      else if (c.days <= 45) s.warning++;
      else s.dying++;
    });
    return s;
  }, [filter]);

  // Calculate category counts for filter buttons
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: MOCK_CONTACTS.length,
      family: 0, friends: 0, work: 0, clients: 0, networking: 0
    };
    MOCK_CONTACTS.forEach(c => {
      if (counts[c.category] !== undefined) {
        counts[c.category]++;
      }
    });
    return counts as Record<FilterType, number>;
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <div className="max-w-5xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-slate-500 hover:text-slate-800 mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">🍃 Relationship Garden</h1>
          <p className="text-slate-500">Connections arranged by health — healthiest in the center</p>
        </div>

        {/* Filters */}
        <CategoryFilters 
          currentFilter={filter} 
          onFilterChange={setFilter} 
          counts={categoryCounts}
        />

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 pb-10">
          
          <RelationshipGarden contacts={MOCK_CONTACTS} filter={filter} />

          {/* Stats */}
          <GardenStats stats={stats} />

          {/* Legend */}
          <div className="mt-8 bg-slate-50 rounded-xl p-6 border border-slate-100">
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
              📍 Position = Relationship Health
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-3">
              {[
                { label: 'Inner Circle: 0-7 days (Healthy)', color: '#10b981' },
                { label: 'Ring 2: 8-21 days (Good)', color: '#84cc16' },
                { label: 'Ring 3: 22-45 days (Warning)', color: '#fbbf24' },
                { label: 'Outer Ring: 45+ days (Dying)', color: '#f97316' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-sm text-slate-600">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
