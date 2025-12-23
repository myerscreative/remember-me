'use client';
import { useState, useMemo, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Contact } from './mockContacts';
import { calculateMatchScore } from './utils/matchUtils';
import { calculateDaysAgo, getContactStatus } from './utils/dateUtils';
import NetworkHeader from './components/NetworkHeader';
import NetworkSearchBar from './components/NetworkSearchBar';
import ContactsGrid from './components/ContactsGrid';
import QuickFilters from './components/QuickFilters';
import EmptyState from './components/EmptyState';
import SuggestionPanel from './components/SuggestionPanel';
import DetailsDrawer from './components/DetailsDrawer';
import { Loader2 } from 'lucide-react';

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

export default function NetworkPage() {
  const [viewMode, setViewMode] = useState<'compact' | 'standard' | 'detailed'>('standard');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | undefined>(undefined);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [previewContact, setPreviewContact] = useState<Contact | null>(null);
  
  // Real data state
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch real contacts from Supabase
  useEffect(() => {
    async function loadContacts() {
      try {
        const supabase = createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          setError('Please log in to view your network');
          setLoading(false);
          return;
        }

        // Fetch persons
        const { data: persons, error: fetchError } = await (supabase as any)
          .from('persons')
          .select('id, name, first_name, last_name, photo_url, email, phone, notes, interests, last_contact, where_met')
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

        // Transform to network Contact format
        const networkContacts: Contact[] = (persons || []).map((person: any, index: number) => {
          const tags = tagsMap.get(person.id) || [];
          const fullName = person.name || `${person.first_name || ''} ${person.last_name || ''}`.trim();
          
          return {
            id: index + 1, // Network page expects numeric id
            name: fullName,
            initials: getInitials(person.first_name || '', person.last_name, fullName),
            photo: person.photo_url || null,
            role: '', // Not stored in current schema
            location: person.where_met || '', // Use where_met as location fallback
            interests: person.interests || [],
            tags: tags,
            lastContact: person.last_contact ? {
              date: person.last_contact,
              method: 'other' as const
            } : undefined,
            email: person.email || undefined,
            phone: person.phone || undefined,
            notes: person.notes || undefined,
          };
        });

        setContacts(networkContacts);
      } catch (err) {
        console.error('Error loading contacts:', err);
        setError('Failed to load contacts');
      } finally {
        setLoading(false);
      }
    }

    loadContacts();
  }, []);

  // Filter Logic
  const filteredContacts = useMemo(() => {
    let results = contacts;
    
    // 1. Search Filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter((c) =>
        c.name.toLowerCase().includes(term) ||
        (c.role && c.role.toLowerCase().includes(term)) ||
        (c.location && c.location.toLowerCase().includes(term)) ||
        (c.tags && c.tags.some((t) => t.toLowerCase().includes(term))) ||
        (c.interests && c.interests.some((i) => i.toLowerCase().includes(term)))
      );
    }

    // 2. Quick Filters
    if (activeFilters.length > 0) {
      // Overdue
      if (activeFilters.includes('overdue')) {
        results = results.filter((c) => {
          const days = calculateDaysAgo(c.lastContact?.date);
          const status = getContactStatus(days);
          return status === 'overdue';
        });
      }
      
      // Not Connected (never contacted or no record)
      if (activeFilters.includes('notConnected')) {
        results = results.filter((c) => {
           const days = calculateDaysAgo(c.lastContact?.date);
           return !c.lastContact || getContactStatus(days) === 'never';
        });
      }

      // Shared Interests (Strong Matches, requires selection)
      if (activeFilters.includes('shared') && selectedContact) {
         results = results.filter((c) => {
            if (c.id === selectedContact.id) return false;
            const { level } = calculateMatchScore(selectedContact, c);
            return level === 'strong' || level === 'medium';
         });
      }

      // Same Location
      if (activeFilters.includes('sameLocation')) {
        const locationCounts: Record<string, number> = {};
        contacts.forEach(person => {
          if (person.location) {
            locationCounts[person.location] = (locationCounts[person.location] || 0) + 1;
          }
        });
        
        const locations = Object.keys(locationCounts);
        if (locations.length > 0) {
            const mostCommonLocation = locations.reduce((a, b) => 
                locationCounts[a] > locationCounts[b] ? a : b
            );
            results = results.filter(c => c.location === mostCommonLocation);
        }
      }
    }
    
    return results;
  }, [searchTerm, activeFilters, selectedContact, contacts]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setActiveFilters([]);
    setSelectedContact(undefined);
  };

  // Search Results Info Logic
  const showSearchResults = searchTerm.length > 0;
  const matchCount = filteredContacts.length;

  // Loading state
  if (loading) {
    return (
      <div className="p-4 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-2" />
          <p className="text-gray-600">Loading your network...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-4 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <a href="/login" className="text-blue-600 hover:underline">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 relative min-h-screen">
      <NetworkHeader viewMode={viewMode} setViewMode={setViewMode} />
      <NetworkSearchBar onSearch={setSearchTerm} />
      
      {/* Search Results Summary */}
      {showSearchResults && (
        <div className="mb-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
           <div className="flex justify-between items-center">
              <p className="text-gray-700">
                Found <span className="font-semibold text-indigo-600">{matchCount}</span> {matchCount === 1 ? 'person' : 'people'} matching &quot;{searchTerm}&quot;
              </p>
              <button onClick={() => setSearchTerm('')} className="text-sm text-gray-400 hover:text-gray-600">Clear</button>
           </div>
           
           {/* Suggestion for many matches */}
           {matchCount >= 3 && (
             <div className="mt-3 p-3 bg-indigo-50 border border-indigo-100 rounded-lg flex justify-between items-center text-sm">
               <p className="text-indigo-800">💡 These {matchCount} people match &quot;{searchTerm}&quot; - consider creating a group event!</p>
               <button className="px-3 py-1.5 bg-indigo-600 text-white rounded-md text-xs font-medium hover:bg-indigo-700 transition">
                 Create Event
               </button>
             </div>
           )}
        </div>
      )}

      <QuickFilters activeFilters={activeFilters} setActiveFilters={setActiveFilters} />
      
      {filteredContacts.length > 0 ? (
        <ContactsGrid
          contacts={filteredContacts}
          selectedContact={selectedContact}
          viewMode={viewMode}
          onSelectContact={(contact) => {
            if (selectedContact?.id === contact.id) {
              setSelectedContact(undefined);
            } else {
              setSelectedContact(contact);
            }
          }}
          onPreviewContact={setPreviewContact}
        />
      ) : (
        <EmptyState onClearFilters={handleClearFilters} />
      )}
      
      {/* Show suggestions if we have some candidates */}
      {!showSearchResults && contacts.length > 0 && <SuggestionPanel suggestions={contacts.slice(0, 3)} />}

      {/* Details Drawer */}
      <DetailsDrawer 
        contact={previewContact} 
        isOpen={!!previewContact} 
        onClose={() => setPreviewContact(null)} 
      />
    </div>
  );
}
