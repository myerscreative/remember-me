
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, List, LayoutGrid, Share2, Sparkles } from 'lucide-react';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';
import RelationshipGarden, { Contact } from '@/components/relationship-garden/RelationshipGarden';
// import GardenView from '@/components/garden/GardenView';
import CategoryFilters, { FilterType } from '@/components/relationship-garden/CategoryFilters';
import GardenStats from '@/components/relationship-garden/GardenStats';
import NurtureSidebar from '@/components/relationship-garden/NurtureSidebar';
import GardenLegend from '@/components/relationship-garden/GardenLegend';
import LogInteractionModal from '@/components/relationship-garden/LogInteractionModal';
import { toast } from 'sonner';

const NetworkGraphView = dynamic(() => import('@/components/relationship-garden/NetworkGraphView'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-96"><Loader2 className="animate-spin h-8 w-8 text-slate-400" /></div>
});

// Health status types
type HealthStatus = 'all' | 'blooming' | 'nourished' | 'thirsty' | 'fading';

// Health colors and config
const healthConfig = {
  blooming: { color: '#22c55e', label: 'Blooming', range: '0-7 days', bgClass: 'bg-emerald-500' },
  nourished: { color: '#84cc16', label: 'Nourished', range: '8-21 days', bgClass: 'bg-lime-500' },
  thirsty: { color: '#eab308', label: 'Thirsty', range: '22-45 days', bgClass: 'bg-yellow-500' },
  fading: { color: '#f97316', label: 'Fading', range: '45+ days', bgClass: 'bg-orange-500' },
};

// Get health status from days
function getHealthStatus(days: number): 'blooming' | 'nourished' | 'thirsty' | 'fading' {
  if (days <= 7) return 'blooming';
  if (days <= 21) return 'nourished';
  if (days <= 45) return 'thirsty';
  return 'fading';
}

// Success Seeds Messages
const SUCCESS_SEEDS = [
  "Relationship successfully watered! 🌱",
  "You just planted a seed of connection. ✨",
  "Relationship Nourished! Moved to the inner circle. 🌸",
  "Intentionality pays off. Your garden is growing. 🌿",
  "Connection refreshed. That large leaf is blooming again! 🍃"
];

// ... (mapTagsToCategory, calculateDaysSinceContact, getInitials remain same) ...



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
  company?: string | null;
  interests?: string[] | null;
  tags?: string[];
  is_favorite?: boolean;
  target_frequency_days?: number | null;
}

export default function GardenPage() {
  const [categoryFilter, setCategoryFilter] = useState<FilterType>('all');
  const [healthFilter, setHealthFilter] = useState<HealthStatus>('all');
  const [viewMode, setViewMode] = useState<'garden' | 'list' | 'graph'>('garden');
  const [contacts, setContacts] = useState<ExtendedContact[]>([]);
  const [relationships, setRelationships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  
  // Modal state for logging interactions
  const [selectedContactForModal, setSelectedContactForModal] = useState<ExtendedContact | null>(null);
  const [hoveredContactId, setHoveredContactId] = useState<string | null>(null);
  const [uncategorizedCount, setUncategorizedCount] = useState(0);

  // Fetch contacts from Supabase
  useEffect(() => {
    console.log("🌱🌱🌱 GARDEN PAGE v2.1 - NEW CODE IS RUNNING! 🌱🌱🌱");
    
    const fetchGardenData = async () => { loadContacts(); };
    fetchGardenData();
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

      // Check for contacts without target frequency
      const { count: uCount, error: countError } = await (supabase as any)
        .from('persons')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .is('target_frequency_days', null)
        .eq('archived', false);
      
      if (!countError) setUncategorizedCount(uCount || 0);

      // Fetch persons and relationships
      const { data: persons, error: fetchError } = await (supabase as any)
        .from('persons')
        .select('id, name, first_name, last_name, last_contact, last_interaction_date, created_at, importance, company, interests, is_favorite, target_frequency_days')
        .eq('user_id', user.id)
        .eq('archived', false)
        .order('name');
        
      if (fetchError) {
        console.error('Error fetching persons:', fetchError);
        setError('Failed to load contacts');
        setLoading(false);
        return;
      }

      // Fetch relationships for graph
      const { data: allRelationships } = await (supabase as any)
        .from('relationships') // Updated to use the correct table
        .select('*');
      
      setRelationships(allRelationships || []);

      const gardenContacts: ExtendedContact[] = (persons || []).map((person: any) => {
        // Use interests as a proxy for tags to determine category
        const interestsList = person.interests || [];
        return {
          id: person.id,
          dbId: person.id,
          name: person.name || `${person.first_name} ${person.last_name || ''}`.trim(),
          initials: getInitials(person.first_name, person.last_name, person.name),
          days: calculateDaysSinceContact(person.last_contact, person.last_interaction_date),
          importance: person.importance || 'medium',
          category: mapTagsToCategory(interestsList), // Using interests for categorization
          company: person.company,
          interests: person.interests,
          tags: interestsList, // Using interests as fallback for tags
          is_favorite: person.is_favorite || false,
          target_frequency_days: person.target_frequency_days,
          // Mapped for GardenView
          targetFrequencyDays: person.target_frequency_days,
          daysSinceLastContact: calculateDaysSinceContact(person.last_contact, person.last_interaction_date),
          photoUrl: person.photo_url || null,
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

  // Set importance
  async function setImportance(contact: ExtendedContact, newImportance: 'high' | 'medium' | 'low') {
    setUpdatingId(contact.dbId);
    try {
      const supabase = createClient();
      const { error } = await (supabase as any)
        .from('persons')
        .update({ importance: newImportance })
        .eq('id', contact.dbId);

      if (error) throw error;
      
      const updatedContact = { ...contact, importance: newImportance };
      
      setContacts(prev => prev.map(c => 
        c.dbId === contact.dbId ? updatedContact : c
      ));

      // Update modal state if open
      if (selectedContactForModal?.dbId === contact.dbId) {
        setSelectedContactForModal(updatedContact);
      }

      toast.success('Updated importance');
    } catch (err) {
      console.error('Error updating importance:', err);
      toast.error('Failed to update importance');
    } finally {
      setUpdatingId(null);
    }
  }

  // Set target frequency
  async function setTargetFrequency(contact: ExtendedContact, newFrequency: number) {
    setUpdatingId(contact.dbId);
    try {
      const supabase = createClient();
      const { error } = await (supabase as any)
        .from('persons')
        .update({ target_frequency_days: newFrequency })
        .eq('id', contact.dbId);

      if (error) throw error;
      
      const updatedContact = { ...contact, target_frequency_days: newFrequency, targetFrequencyDays: newFrequency };

      setContacts(prev => prev.map(c => 
        c.dbId === contact.dbId ? updatedContact : c
      ));

      // Update modal state if open
      if (selectedContactForModal?.dbId === contact.dbId) {
        setSelectedContactForModal(updatedContact);
      }

      toast.success('Updated target frequency');
    } catch (err) {
      console.error('Error updating frequency:', err);
      toast.error('Failed to update frequency');
    } finally {
      setUpdatingId(null);
    }
  }

  // Set health status by calculating a date that puts them in that ring
  async function setHealthStatus(contact: ExtendedContact, targetStatus: 'blooming' | 'nourished' | 'thirsty' | 'fading') {
    setUpdatingId(contact.dbId);
    try {
      const supabase = createClient();
      
      // Calculate the date that will result in the target status
      // healthy: 0-7 days → set to today
      // good: 8-21 days → set to 14 days ago (middle of range)
      // warning: 22-45 days → set to 30 days ago (middle of range)
      // dying: 45+ days → set to 60 days ago
      const now = new Date();
      let targetDate: Date;
      let targetDays: number;
      
      switch (targetStatus) {
        case 'blooming':
          targetDays = 0;
          targetDate = now;
          break;
        case 'nourished':
          targetDays = 14;
          targetDate = new Date(now.getTime() - (14 * 24 * 60 * 60 * 1000));
          break;
        case 'thirsty':
          targetDays = 30;
          targetDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
          break;
        case 'fading':
          targetDays = 60;
          targetDate = new Date(now.getTime() - (60 * 24 * 60 * 60 * 1000));
          break;
      }
      
      const dateString = targetDate.toISOString().split('T')[0];
      
      const { error } = await (supabase as any)
        .from('persons')
        .update({ last_contact: dateString })
        .eq('id', contact.dbId);

      if (error) throw error;
      
      // Update local state
      setContacts(prev => prev.map(c => 
        c.dbId === contact.dbId ? { ...c, days: targetDays } : c
      ));
      
      toast.success(`Moved ${contact.name} to ${healthConfig[targetStatus].label}!`);
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

    const s = { blooming: 0, nourished: 0, thirsty: 0, fading: 0 };
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
      <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] font-sans transition-colors">
        <div className="max-w-[1400px] mx-auto px-4 py-8">
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">🍃 Relationship Garden</h1>
          </div>
          
          <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-12 text-center transition-colors">
            <p className="text-6xl mb-4">🌱</p>
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">Your garden is empty</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">Add some contacts to see them bloom in your garden!</p>
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

  // Quick Log handler
  const handleQuickLog = async (contact: { id: string | number, name: string }) => {
    // Optimistic update
    const extendedContact = contacts.find(c => c.id === contact.id);
    if (!extendedContact) return;

    setContacts(prev => prev.map(c => 
      c.id === contact.id ? { ...c, days: 0 } : c
    ));

    // Server update
    try {
      const { logInteraction } = await import('@/app/actions/logInteraction');
      const result = await logInteraction({
        personId: extendedContact.dbId,
        type: 'text', // Quick Log assumes a quick check-in/text
        note: '⚡ Quick Log'
      });
      if (result.success) {
        const randomMessage = SUCCESS_SEEDS[Math.floor(Math.random() * SUCCESS_SEEDS.length)];
        toast.success(randomMessage, { icon: '🌱', duration: 4000 });
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to log interaction");
      loadContacts(); // Reload to be safe
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] font-sans transition-colors overflow-x-hidden">
      <div className="max-w-[1400px] mx-auto px-4 py-8">
        
        {/* Header - Compact on mobile */}
        <div className="mb-4 md:mb-6">
          <Link href="/" className="inline-flex items-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 mb-3 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Link>
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-1">🍃 Relationship Garden</h1>
              <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 hidden md:block">Click a health status to see contacts in that group</p>
            </div>

            {/* Desktop-only view controls */}
            <div className="hidden md:flex items-center gap-2">
              <Link
                href="/triage"
                className="px-3 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors flex items-center gap-2 font-medium text-sm mr-2"
                title="Rapidly prioritize contacts"
              >
                🚨 Triage
              </Link>
              <button
                onClick={() => setViewMode('garden')}
                className={`p-2 rounded-lg border transition-colors ${
                  viewMode === 'garden'
                    ? 'bg-slate-900 dark:bg-slate-700 text-white border-slate-900 dark:border-slate-700'
                    : 'bg-white dark:bg-[#1e293b] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
                title="Garden View"
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg border transition-colors ${
                  viewMode === 'list'
                    ? 'bg-slate-900 dark:bg-slate-700 text-white border-slate-900 dark:border-slate-700'
                    : 'bg-white dark:bg-[#1e293b] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
                title="List View"
              >
                <List className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('graph')}
                className={`p-2 rounded-lg border transition-colors ${
                  viewMode === 'graph'
                    ? 'bg-slate-900 dark:bg-slate-700 text-white border-slate-900 dark:border-slate-700'
                    : 'bg-white dark:bg-[#1e293b] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
                title="Network Graph"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* MOBILE: Garden First, Filters Below */}
        <div className="md:hidden">
          {/* View Mode Toggle - ALWAYS AT TOP */}
          <div className="flex items-center gap-2 justify-center bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-800 p-3 mb-4">
            <button
              onClick={() => setViewMode('garden')}
              className={`flex-1 py-2 rounded-lg border transition-colors ${
                viewMode === 'garden'
                  ? 'bg-slate-900 dark:bg-slate-700 text-white border-slate-900 dark:border-slate-700'
                  : 'bg-white dark:bg-[#1e293b] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              <LayoutGrid className="w-5 h-5 mx-auto" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex-1 py-2 rounded-lg border transition-colors ${
                viewMode === 'list'
                  ? 'bg-slate-900 dark:bg-slate-700 text-white border-slate-900 dark:border-slate-700'
                  : 'bg-white dark:bg-[#1e293b] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              <List className="w-5 h-5 mx-auto" />
            </button>
            <button
              onClick={() => setViewMode('graph')}
              className={`flex-1 py-2 rounded-lg border transition-colors ${
                viewMode === 'graph'
                  ? 'bg-slate-900 dark:bg-slate-700 text-white border-slate-900 dark:border-slate-700'
                  : 'bg-white dark:bg-[#1e293b] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              <Share2 className="w-5 h-5 mx-auto" />
            </button>
          </div>

          {/* Garden View */}
          {viewMode === 'garden' && healthFilter === 'all' && (
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 mb-4 transition-colors">
              <RelationshipGarden
                contacts={filteredContacts}
                relationships={relationships} // Pass relationships data
                filter={categoryFilter}
                onContactClick={(contact) => {
                  const extendedContact = contacts.find(c => c.id === contact.id);
                  if (extendedContact) {
                    setSelectedContactForModal(extendedContact);
                  }
                }}
                onQuickLog={handleQuickLog}
                hoveredContactId={hoveredContactId}
              />
            </div>
          )}

          {/* List View on Mobile */}
          {(viewMode === 'list' || healthFilter !== 'all') && (
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 mb-4">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                  {healthFilter !== 'all' ? `${healthConfig[healthFilter].label} Contacts` : 'All Contacts'}
                  <span className="ml-2 text-slate-400 font-normal">({filteredContacts.length})</span>
                </h3>
              </div>

              {filteredContacts.length === 0 ? (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                  No contacts in this category
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredContacts.map(contact => {
                    const status = getHealthStatus(contact.days);
                    const config = healthConfig[status];
                    return (
                      <div
                        key={contact.dbId}
                        onClick={() => window.location.href = `/contacts/${contact.dbId}`}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                      >
                        <div className="flex items-start gap-3 mb-2">
                          <div
                            className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                            style={{ backgroundColor: config.color }}
                          >
                            {contact.initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-slate-800 dark:text-slate-200 truncate">
                              {contact.name}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {contact.days === 999 ? 'Never contacted' : `${contact.days} days ago`} • {contact.category}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={contact.importance || 'medium'}
                            onChange={(e) => setImportance(contact, e.target.value as 'high' | 'medium' | 'low')}
                            disabled={updatingId === contact.dbId}
                            className="flex-1 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium bg-white dark:bg-slate-800"
                          >
                            <option value="high">⭐ Favorite</option>
                            <option value="medium">🔹 Friend</option>
                            <option value="low">▫️ Contact</option>
                          </select>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const extendedContact = contacts.find(c => c.id === contact.id);
                              if (extendedContact) setSelectedContactForModal(extendedContact);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-medium"
                          >
                            Connect
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Graph View on Mobile */}
          {viewMode === 'graph' && (
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 mb-4">
              <NetworkGraphView
                contacts={filteredContacts}
                relationships={relationships}
                onNodeClick={(id) => window.location.href = `/contacts/${id}`}
              />
            </div>
          )}
          
          {/* Stats on Mobile - moved below graph/list but above filters if in list/graph mode? 
              User request: "Garden graphic... underneath it the statistics... same for other items".
              So we want Content -> Stats -> Filters?
              Or Content -> Filters -> Stats?
              
              "On the view of the garden... Garden graphic up near the top... Underneath it, the statistics..."
              Original Garden Layout: Garden -> Filters -> Stats (at bottom).
              Wait, Image 1 shows Stats (Health Status) DIRECTLY under Garden.
              
              Let's keep Stats at the bottom effectively or right after content?
              The user wants CONSISTENCY.
              
              If I put List/Graph here, then the Filters (Health Status) will be BELOW them.
              Which matches "Order ... same as view of all leaves" (Visual -> Filters).
          */}
          
          {/* Filters & Controls Section */}
          <div className="space-y-3 mb-4">
            
            {/* Health Status Filters - Compact */}
            <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-800 p-3">
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Health Status</div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setHealthFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    healthFilter === 'all'
                      ? 'bg-slate-900 dark:bg-slate-700 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
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
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all`}
                      style={{
                        backgroundColor: healthFilter === status ? config.color : `${config.color}20`,
                        color: healthFilter === status ? 'white' : config.color
                      }}
                    >
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />
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

            {/* Triage Link */}
            <Link
              href="/triage"
              className="block text-center px-4 py-3 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-xl hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors font-medium"
            >
              🚨 Triage Mode
            </Link>

            {/* Nurture Sidebar */}
            {viewMode === 'garden' && healthFilter === 'all' && (
              <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4">
                <NurtureSidebar
                  contacts={contacts}
                  onQuickLog={handleQuickLog}
                  onHover={setHoveredContactId}
                />
              </div>
            )}

            {/* Legend */}
            {viewMode === 'garden' && healthFilter === 'all' && (
              <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4">
                <GardenLegend />
              </div>
            )}
          </div>
        </div>

        {/* DESKTOP: Original Layout */}
        <div className="hidden md:block">
          {/* Health Status Bar (clickable filters) */}
          <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-800 p-4 mb-4 transition-colors">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setHealthFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  healthFilter === 'all'
                    ? 'bg-slate-900 dark:bg-slate-700 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
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
                        ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-slate-500 dark:ring-offset-[#1e293b]'
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
          <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 pb-10 transition-colors">

            {viewMode === 'garden' && healthFilter === 'all' && (
              <div className="flex flex-col lg:flex-row gap-6 items-start max-w-[1280px] mx-auto justify-center">
                <div className="flex-1 w-full min-w-0">
                  <RelationshipGarden
                    contacts={filteredContacts}
                    relationships={relationships} // Pass relationships data
                    filter={categoryFilter}
                    onContactClick={(contact) => {
                      const extendedContact = contacts.find(c => c.id === contact.id);
                      if (extendedContact) {
                        setSelectedContactForModal(extendedContact);
                      }
                    }}
                    onQuickLog={handleQuickLog}
                    hoveredContactId={hoveredContactId}
                  />
                </div>

                <div className="w-full lg:w-80 flex flex-col gap-6 shrink-0 h-full">
                  <NurtureSidebar
                    contacts={contacts}
                    onQuickLog={handleQuickLog}
                    onHover={setHoveredContactId}
                  />
                  <GardenLegend />
                </div>
              </div>
            )}

            {/* List View or Filtered Health View */}
            {(viewMode === 'list' || healthFilter !== 'all') && (
              <div className="space-y-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                    {healthFilter !== 'all' ? `${healthConfig[healthFilter].label} Contacts` : 'All Contacts'}
                    <span className="ml-2 text-slate-400 font-normal">({filteredContacts.length})</span>
                  </h3>
                </div>

                {filteredContacts.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                    No contacts in this category
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredContacts.map(contact => {
                      const status = getHealthStatus(contact.days);
                      const config = healthConfig[status];
                      return (
                        <div
                          key={contact.dbId}
                          onClick={() => window.location.href = `/contacts/${contact.dbId}`}
                          className="group py-4 px-4 -mx-4 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/40 transition-colors flex items-center justify-between cursor-pointer"
                        >
                          <div className="flex items-center gap-4">
                            {/* Status indicator */}
                            <div
                              className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                              style={{ backgroundColor: config.color }}
                            >
                              {contact.initials}
                            </div>

                            <div>
                              <div className="flex items-center gap-3">
                                <span className="font-medium text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                  {contact.name}
                                </span>

                                {/* Connect Now Button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const extendedContact = contacts.find(c => c.id === contact.id);
                                    if (extendedContact) setSelectedContactForModal(extendedContact);
                                  }}
                                  className="hidden group-hover:inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wide hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                                >
                                  Connect Now
                                </button>
                              </div>

                              <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                <span>{contact.days === 999 ? 'Never contacted' : `${contact.days} days ago`}</span>
                                <span>•</span>
                                <span className="capitalize">{contact.category}</span>
                              </div>
                            </div>
                          </div>

                          {/* Controls */}
                          <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                            {/* Importance Selector */}
                            <select
                              value={contact.importance || 'medium'}
                              onChange={(e) => setImportance(contact, e.target.value as 'high' | 'medium' | 'low')}
                              disabled={updatingId === contact.dbId}
                              className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium bg-white dark:bg-slate-800 cursor-pointer hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-600 dark:text-slate-300"
                            >
                              <option value="high">⭐ Favorite</option>
                              <option value="medium">🔹 Friend</option>
                              <option value="low">▫️ Contact</option>
                            </select>

                            {/* Health Status Selector */}
                            <div className="flex items-center gap-2">
                              {updatingId === contact.dbId ? (
                                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                              ) : (
                                <select
                                  value={status}
                                  onChange={(e) => setHealthStatus(contact, e.target.value as 'blooming' | 'nourished' | 'thirsty' | 'fading')}
                                  className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium bg-white dark:bg-slate-800 cursor-pointer hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  style={{
                                    color: config.color,
                                    borderColor: config.color + '40'
                                  }}
                                >
                                  <option value="blooming" style={{ color: '#22c55e' }}>🟢 Blooming</option>
                                  <option value="nourished" style={{ color: '#84cc16' }}>🟡 Nourished</option>
                                  <option value="thirsty" style={{ color: '#eab308' }}>🟠 Thirsty</option>
                                  <option value="fading" style={{ color: '#f97316' }}>🔴 Fading</option>
                                </select>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Graph View */}
            {viewMode === 'graph' && (
              <div>
                <NetworkGraphView
                  contacts={filteredContacts}
                  relationships={relationships}
                  onNodeClick={(id) => window.location.href = `/contacts/${id}`}
                />
              </div>
            )}

            {/* Stats (only in garden view with no health filter) */}
            {viewMode === 'garden' && healthFilter === 'all' && (
              <GardenStats stats={stats} />
            )}

            {/* Vertical spacing for bottom of list view */}
            {viewMode === 'list' && (
              <div className="h-4"></div>
            )}
          </div>
        </div>
      </div>

      {/* Log Interaction Modal */}
      {selectedContactForModal && (
        <LogInteractionModal
          contact={{
            id: selectedContactForModal.dbId,
            name: selectedContactForModal.name,
            initials: selectedContactForModal.initials,
            importance: selectedContactForModal.importance,
            targetFrequencyDays: selectedContactForModal.target_frequency_days || selectedContactForModal.targetFrequencyDays,
          }}
          isOpen={!!selectedContactForModal}
          onClose={() => setSelectedContactForModal(null)}
          onUpdateImportance={(newImp) => setImportance(selectedContactForModal, newImp)}
          onUpdateFrequency={(newFreq) => setTargetFrequency(selectedContactForModal, newFreq)}
          onSuccess={() => {
            // Reload contacts to update positions
            loadContacts();
          }}
        />
      )}
    </div>
  );
}
