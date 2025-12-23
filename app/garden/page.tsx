
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Check, List, LayoutGrid } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import RelationshipGarden, { Contact } from '@/components/relationship-garden/RelationshipGarden';
import CategoryFilters, { FilterType } from '@/components/relationship-garden/CategoryFilters';
import GardenStats from '@/components/relationship-garden/GardenStats';
import toast from 'react-hot-toast';

// Health status types
type HealthStatus = 'all' | 'healthy' | 'good' | 'warning' | 'dying';

// Health colors and config
const healthConfig = {
  healthy: { color: '#10b981', label: 'Healthy', range: '0-7 days', bgClass: 'bg-emerald-500' },
  good: { color: '#84cc16', label: 'Good', range: '8-21 days', bgClass: 'bg-lime-500' },
  warning: { color: '#fbbf24', label: 'Warning', range: '22-45 days', bgClass: 'bg-amber-400' },
  dying: { color: '#f97316', label: 'Needs Love', range: '45+ days', bgClass: 'bg-orange-500' },
};

// Get health status from days
function getHealthStatus(days: number): 'healthy' | 'good' | 'warning' | 'dying' {
  if (days <= 7) return 'healthy';
  if (days <= 21) return 'good';
  if (days <= 45) return 'warning';
  return 'dying';
}

// Map tag names to garden categories
function mapTagsToCategory(tagNames: string[]): FilterType {
  const lowerTags = tagNames.map(t => t.toLowerCase());
  
  if (lowerTags.some(t => t.includes('family'))) return 'family';
  if (lowerTags.some(t => t.includes('work') || t.includes('colleague'))) return 'work';
  if (lowerTags.some(t => t.includes('client') || t.includes('customer'))) return 'clients';
  if (lowerTags.some(t => t.includes('network') || t.includes('mentor') || t.includes('professional'))) return 'networking';
  if (lowerTags.some(t => t.includes('friend'))) return 'friends';
  
  return 'friends';
}

// Calculate days since last contact - NO last_contact means DYING not healthy
function calculateDaysSinceContact(lastContact: string | null, lastInteractionDate: string | null): number {
  const dateToUse = lastContact || lastInteractionDate;
  if (!dateToUse) return 999; // Very old if no date = needs attention
  
  const contactDate = new Date(dateToUse);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - contactDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

// Get initials from name
function getInitials(firstName: string, lastName: string | null, name: string): string {
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }
  if (firstName) {
    return firstName.slice(0, 2).toUpperCase();
  }
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

// Extended contact with db id
interface ExtendedContact extends Contact {
  dbId: string;
}

export default function GardenPage() {
  const [categoryFilter, setCategoryFilter] = useState<FilterType>('all');
  const [healthFilter, setHealthFilter] = useState<HealthStatus>('all');
  const [viewMode, setViewMode] = useState<'garden' | 'list'>('garden');
  const [contacts, setContacts] = useState<ExtendedContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Fetch contacts from Supabase
  useEffect(() => {
    loadContacts();
  }, []);

  async function loadContacts() {
    try {
      const supabase = createClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        setError('Please log in to view your garden');
        setLoading(false);
        return;
      }

      // Fetch persons
      const { data: persons, error: fetchError } = await (supabase as any)
        .from('persons')
        .select('id, name, first_name, last_name, last_contact, last_interaction_date, created_at')
        .eq('user_id', user.id)
        .eq('archived', false)
        .order('name');

      if (fetchError) {
        console.error('Error fetching persons:', fetchError);
        setError('Failed to load contacts');
        setLoading(false);
        return;
      }

      // Fetch person_tags
      const personIds = persons?.map((p: any) => p.id) || [];
      const { data: personTags } = await (supabase as any)
        .from('person_tags')
        .select('person_id, tags(name)')
        .in('person_id', personIds);

      const tagsMap = new Map<string, string[]>();
      personTags?.forEach((pt: any) => {
        const personId = pt.person_id;
        const tagName = pt.tags?.name;
        if (tagName) {
          if (!tagsMap.has(personId)) {
            tagsMap.set(personId, []);
          }
          tagsMap.get(personId)?.push(tagName);
        }
      });

      const gardenContacts: ExtendedContact[] = (persons || []).map((person: any) => {
        const tagNames = tagsMap.get(person.id) || [];
        return {
          id: person.id,
          dbId: person.id,
          name: person.name || `${person.first_name} ${person.last_name || ''}`.trim(),
          initials: getInitials(person.first_name, person.last_name, person.name),
          days: calculateDaysSinceContact(person.last_contact, person.last_interaction_date),
          category: mapTagsToCategory(tagNames),
        };
      });

      setContacts(gardenContacts);
    } catch (err) {
      console.error('Error loading contacts:', err);
      setError('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  }

  // Mark as contacted today
  async function markAsContacted(contact: ExtendedContact) {
    setUpdatingId(contact.dbId);
    try {
      const supabase = createClient();
      const today = new Date().toISOString().split('T')[0];
      
      const { error } = await (supabase as any)
        .from('persons')
        .update({ last_contact: today })
        .eq('id', contact.dbId);

      if (error) throw error;
      
      // Update local state
      setContacts(prev => prev.map(c => 
        c.dbId === contact.dbId ? { ...c, days: 0 } : c
      ));
      
      toast.success(`Marked ${contact.name} as contacted today!`);
    } catch (err) {
      console.error('Error updating contact:', err);
      toast.error('Failed to update contact');
    } finally {
      setUpdatingId(null);
    }
  }

  // Calculate stats
  const stats = useMemo(() => {
    let filtered = contacts;
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(c => c.category === categoryFilter);
    }

    const s = { healthy: 0, good: 0, warning: 0, dying: 0 };
    filtered.forEach(c => {
      const status = getHealthStatus(c.days);
      s[status]++;
    });
    return s;
  }, [categoryFilter, contacts]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: contacts.length,
      family: 0, friends: 0, work: 0, clients: 0, networking: 0
    };
    contacts.forEach(c => {
      if (counts[c.category] !== undefined) {
        counts[c.category]++;
      }
    });
    return counts as Record<FilterType, number>;
  }, [contacts]);

  // Filtered contacts for display
  const filteredContacts = useMemo(() => {
    let result = contacts;
    
    if (categoryFilter !== 'all') {
      result = result.filter(c => c.category === categoryFilter);
    }
    
    if (healthFilter !== 'all') {
      result = result.filter(c => getHealthStatus(c.days) === healthFilter);
    }
    
    // Sort by days (oldest first for list view)
    return result.sort((a, b) => b.days - a.days);
  }, [contacts, categoryFilter, healthFilter]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-green-600 mb-2" />
          <p className="text-slate-600">Loading your garden...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/login" className="text-blue-600 hover:underline">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  // Empty state
  if (contacts.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center text-slate-500 hover:text-slate-800 mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">🍃 Relationship Garden</h1>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
            <p className="text-6xl mb-4">🌱</p>
            <h2 className="text-xl font-semibold text-slate-800 mb-2">Your garden is empty</h2>
            <p className="text-slate-500 mb-6">Add some contacts to see them bloom in your garden!</p>
            <Link 
              href="/contacts/new" 
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Add Your First Contact
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <div className="max-w-5xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center text-slate-500 hover:text-slate-800 mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">🍃 Relationship Garden</h1>
              <p className="text-slate-500">Click a health status to see contacts in that group</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('garden')}
                className={`p-2 rounded-lg border transition-colors ${
                  viewMode === 'garden' 
                    ? 'bg-slate-900 text-white border-slate-900' 
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
                title="Garden View"
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg border transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-slate-900 text-white border-slate-900' 
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
                title="List View"
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Health Status Bar (clickable filters) */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setHealthFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                healthFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({contacts.length})
            </button>
            
            {(Object.keys(healthConfig) as Array<keyof typeof healthConfig>).map((status) => {
              const config = healthConfig[status];
              const count = stats[status];
              return (
                <button
                  key={status}
                  onClick={() => setHealthFilter(status)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    healthFilter === status
                      ? 'ring-2 ring-offset-2 ring-slate-900'
                      : 'hover:opacity-80'
                  }`}
                  style={{ 
                    backgroundColor: healthFilter === status ? config.color : `${config.color}20`,
                    color: healthFilter === status ? 'white' : config.color
                  }}
                >
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: config.color }}
                  />
                  {config.label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Category Filters */}
        <CategoryFilters 
          currentFilter={categoryFilter} 
          onFilterChange={setCategoryFilter} 
          counts={categoryCounts}
        />

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 pb-10">
          
          {/* Garden View */}
          {viewMode === 'garden' && healthFilter === 'all' && (
            <RelationshipGarden contacts={filteredContacts} filter={categoryFilter} />
          )}

          {/* List View or Filtered Health View */}
          {(viewMode === 'list' || healthFilter !== 'all') && (
            <div className="space-y-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-800">
                  {healthFilter !== 'all' ? `${healthConfig[healthFilter].label} Contacts` : 'All Contacts'}
                  <span className="ml-2 text-slate-400 font-normal">({filteredContacts.length})</span>
                </h3>
              </div>
              
              {filteredContacts.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  No contacts in this category
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredContacts.map(contact => {
                    const status = getHealthStatus(contact.days);
                    const config = healthConfig[status];
                    return (
                      <div key={contact.dbId} className="py-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {/* Status indicator */}
                          <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                            style={{ backgroundColor: config.color }}
                          >
                            {contact.initials}
                          </div>
                          
                          <div>
                            <Link 
                              href={`/contacts/${contact.dbId}`}
                              className="font-medium text-slate-800 hover:text-blue-600"
                            >
                              {contact.name}
                            </Link>
                            <div className="text-sm text-slate-500 flex items-center gap-2">
                              <span>{contact.days === 999 ? 'Never contacted' : `${contact.days} days ago`}</span>
                              <span>•</span>
                              <span className="capitalize">{contact.category}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <button
                          onClick={() => markAsContacted(contact)}
                          disabled={updatingId === contact.dbId || contact.days === 0}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            contact.days === 0
                              ? 'bg-emerald-100 text-emerald-700 cursor-default'
                              : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                          }`}
                        >
                          {updatingId === contact.dbId ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : contact.days === 0 ? (
                            <>
                              <Check className="w-4 h-4" />
                              Contacted Today
                            </>
                          ) : (
                            <>
                              <Check className="w-4 h-4" />
                              Mark as Contacted
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Stats (only in garden view with no health filter) */}
          {viewMode === 'garden' && healthFilter === 'all' && (
            <GardenStats stats={stats} />
          )}

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
                { label: 'Outer Ring: 45+ days (Needs Love)', color: '#f97316' },
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
