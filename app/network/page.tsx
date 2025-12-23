'use client';
import { useState, useMemo } from 'react';
import { Contact, mockContacts } from './mockContacts';
import { calculateMatchScore } from './utils/matchUtils';
import { calculateDaysAgo, getContactStatus } from './utils/dateUtils';
import NetworkHeader from './components/NetworkHeader';
import NetworkSearchBar from './components/NetworkSearchBar';
import ContactsGrid from './components/ContactsGrid';
import QuickFilters from './components/QuickFilters';

import EmptyState from './components/EmptyState';
import SuggestionPanel from './components/SuggestionPanel';
import DetailsDrawer from './components/DetailsDrawer';

export default function NetworkPage() {
  const [viewMode, setViewMode] = useState<'compact' | 'standard' | 'detailed'>('standard');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | undefined>(undefined);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [previewContact, setPreviewContact] = useState<Contact | null>(null);

  // Filter Logic
  const filteredContacts = useMemo(() => {
    let results = mockContacts;
    
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
           // Assuming 'never' status or missing lastContact
           const days = calculateDaysAgo(c.lastContact?.date);
           return !c.lastContact || getContactStatus(days) === 'never';
        });
      }

      // Shared Interests (Strong Matches, requires selection)
      if (activeFilters.includes('shared') && selectedContact) {
         results = results.filter((c) => {
            if (c.id === selectedContact.id) return false;
            const { level } = calculateMatchScore(selectedContact, c);
            return level === 'strong' || level === 'medium'; // 1+ interests shared? Spec says 'Strong Matches' for filter name usually implies strong, but let's show all matches
         });
      }

      // Same Location
      if (activeFilters.includes('sameLocation')) {
        // Find most common location in *current* dataset (or full dataset?)
        // Spec implies finding most common location strategies
        const locationCounts: Record<string, number> = {};
        mockContacts.forEach(person => {
          locationCounts[person.location] = (locationCounts[person.location] || 0) + 1;
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
  }, [searchTerm, activeFilters, selectedContact]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setActiveFilters([]);
    setSelectedContact(undefined);
  };

  // Search Results Info Logic
  const showSearchResults = searchTerm.length > 0;
  const matchCount = filteredContacts.length;

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
      
      {/* Show suggestions if we have some candidates (mock logic: just first 3 of mockContacts) */}
      {!showSearchResults && <SuggestionPanel suggestions={mockContacts.slice(0, 3)} />}

      {/* Details Drawer */}
      <DetailsDrawer 
        contact={previewContact} 
        isOpen={!!previewContact} 
        onClose={() => setPreviewContact(null)} 
      />
    </div>
  );
}
