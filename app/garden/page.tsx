
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import RelationshipGarden, { Contact } from '@/components/relationship-garden/RelationshipGarden';
import CategoryFilters, { FilterType } from '@/components/relationship-garden/CategoryFilters';
import GardenStats from '@/components/relationship-garden/GardenStats';

// Map tag names to garden categories
function mapTagsToCategory(tagNames: string[]): FilterType {
  const lowerTags = tagNames.map(t => t.toLowerCase());
  
  if (lowerTags.some(t => t.includes('family'))) return 'family';
  if (lowerTags.some(t => t.includes('work') || t.includes('colleague'))) return 'work';
  if (lowerTags.some(t => t.includes('client') || t.includes('customer'))) return 'clients';
  if (lowerTags.some(t => t.includes('network') || t.includes('mentor') || t.includes('professional'))) return 'networking';
  if (lowerTags.some(t => t.includes('friend'))) return 'friends';
  
  // Default to friends for uncategorized
  return 'friends';
}

// Calculate days since last contact
function calculateDaysSinceContact(lastContact: string | null, lastInteractionDate: string | null, createdAt: string): number {
  const dateToUse = lastContact || lastInteractionDate || createdAt;
  if (!dateToUse) return 999; // Very old if no date
  
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
  // Fallback to name
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function GardenPage() {
  const [filter, setFilter] = useState<FilterType>('all');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch contacts from Supabase
  useEffect(() => {
    async function loadContacts() {
      try {
        const supabase = createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          setError('Please log in to view your garden');
          setLoading(false);
          return;
        }

        // Fetch persons with their tags
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

        // Fetch person_tags with tag names
        const personIds = persons?.map((p: any) => p.id) || [];
        const { data: personTags } = await (supabase as any)
          .from('person_tags')
          .select('person_id, tags(name)')
          .in('person_id', personIds);

        // Build a map of person_id -> tag names
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

        // Transform persons to garden Contact format
        const gardenContacts: Contact[] = (persons || []).map((person: any) => {
          const tagNames = tagsMap.get(person.id) || [];
          return {
            id: person.id,
            name: person.name || `${person.first_name} ${person.last_name || ''}`.trim(),
            initials: getInitials(person.first_name, person.last_name, person.name),
            days: calculateDaysSinceContact(person.last_contact, person.last_interaction_date, person.created_at),
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

    loadContacts();
  }, []);

  // Calculate filtered stats
  const stats = useMemo(() => {
    const currentContacts = filter === 'all' 
      ? contacts 
      : contacts.filter(c => c.category === filter);

    const s = { healthy: 0, good: 0, warning: 0, dying: 0 };
    currentContacts.forEach(c => {
      if (c.days <= 7) s.healthy++;
      else if (c.days <= 21) s.good++;
      else if (c.days <= 45) s.warning++;
      else s.dying++;
    });
    return s;
  }, [filter, contacts]);

  // Calculate category counts for filter buttons
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
          
          <RelationshipGarden contacts={contacts} filter={filter} />

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
