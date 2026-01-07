'use client';

import { useState, useEffect, useMemo } from 'react';
import { networkService, NetworkData, SubTribe } from './components/NetworkDataService';
import NetworkSearchBar from './components/NetworkSearchBar';
import { TribeView } from './components/TribeView';
import { LogInteractionModal } from './components/LogInteractionModal';
import { NetworkDomainBar } from './components/NetworkDomainBar';
import { NetworkSubTribeDrawer } from './components/NetworkSubTribeDrawer';
import { NetworkTutorial, TutorialButton } from './components/NetworkTutorial';
import { Loader2 } from 'lucide-react';

export default function NetworkPage() {
  const [data, setData] = useState<NetworkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Tutorial State
  const [showTutorial, setShowTutorial] = useState(false);
  
  // New Domain Logic
  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null);
  const [selectedSubTribeId, setSelectedSubTribeId] = useState<string | null>(null);

  const [nurtureTribe, setNurtureTribe] = useState<SubTribe | null>(null);
  const [isNurtureModalOpen, setIsNurtureModalOpen] = useState(false);

  useEffect(() => {
    // Check if tutorial should be shown
    const hideTutorial = localStorage.getItem('hideTribeSearchTutorial');
    if (!hideTutorial) {
      setShowTutorial(true);
    }

    async function loadData() {
      try {
        const networkData = await networkService.fetchNetworkData();
        setData(networkData);
      } catch (error) {
        console.error('Failed to load network data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleNurtureTribe = (tribe: SubTribe) => {
    setNurtureTribe(tribe);
    setIsNurtureModalOpen(true);
  };
  
  // Derived state for the UI
  const selectedDomainGroup = useMemo(() => {
      if (!data || !selectedDomainId) return null;
      return data.domains.find(d => d.domain.id === selectedDomainId);
  }, [data, selectedDomainId]);
  
  // Transform selected SubTribe into Legacy "Tribe" format for TribeView compatibility
  // Or simpler: Reuse TribeView but pass specific data
  const displayedTribes = useMemo(() => {
    if (!data) return [];

    // 1. Search Mode overrides everything
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        // Fallback to legacy style filtering
        // TODO: Refactor legacy search logic to be cleaner or reuse a helper
        // For now, let's just do a quick scan of all contacts in all domains
        // Alternatively, reuse the existing logic if we kept the `tribes` data?
        // Actually NetworkDataService returns `tribes` property still? 
        // In my last edit I REMOVED `tribes` from NetworkData interface return but I might have kept the method.
        // Let's check `NetworkDataService`. Ah, I removed `tribes` from the interface in the `replace_file_content` call.
        // So we need to reconstruct flat tribes if searching.
        
        // Let's group all contacts by some logic or just show "Search Results" tribe?
        // Let's create a single "Search Results" tribe.
        const allContacts = data.contacts;
        const matching = allContacts.filter(c => 
             c.name.toLowerCase().includes(term) ||
             (c.where_met && c.where_met.toLowerCase().includes(term)) ||
             (c.interests && c.interests.some(i => i.toLowerCase().includes(term))) ||
             (c.tags && c.tags.some(t => t.toLowerCase().includes(term)))
        );
        
        if (matching.length === 0) return [];
        
        const searchTribe: SubTribe = {
            id: 'search-results',
            name: `Results for "${searchTerm}"`,
            domainId: 'search',
            memberCount: matching.length,
            members: matching
        };
        return [searchTribe];
    }
    
    // 2. Domain Mode
    if (selectedDomainId && selectedSubTribeId && selectedDomainGroup) {
        const subTribe = selectedDomainGroup.subTribes.find(st => st.id === selectedSubTribeId);
        if (subTribe) {
             // SubTribe already has the correct format, just return it
             return [subTribe];
        }
    }
    
    // 3. Just Domain selected -> Show nothing? Or show all in domain?
    // Prompt says: "When a user clicks Travel, expand ... sub-tags ... Once a sub-tag is selected, show the contacts"
    // So if just domain is selected, we show sub-tags drawer (handled below), but main view might be empty or "Select a tag" state.
    
    return [];
  }, [data, searchTerm, selectedDomainId, selectedSubTribeId, selectedDomainGroup]);


  if (loading) {
     return (
       <div className="flex h-screen items-center justify-center">
         <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
       </div>
     );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-black/20 p-3 md:p-8">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">

        {/* Header Area */}
        <div className="text-center space-y-3 md:space-y-4 pt-4 md:pt-8 pb-3 md:pb-4 relative">
          <div className="absolute top-2 md:top-4 right-0">
            <TutorialButton onClick={() => setShowTutorial(true)} />
          </div>
          <h1 className="text-2xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
            {selectedDomainGroup ? selectedDomainGroup.domain.name : 'Tribe Search'}
          </h1>
          {!selectedDomainGroup && !searchTerm && (
              <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 max-w-lg mx-auto px-4">
                Discover connections, nurture groups, and see your network as a living ecosystem.
              </p>
          )}
        </div>

        {/* Search Input - Always visible? Or hidden when domain active? 
            Prompt: "Default: When no domain is selected, show the Search Bar. 
            On Selection: Clicking a Domain... reveal only sub-tags"
            
            Let's keep Search Bar always accessible but maybe less prominent if domain selected.
        */}
        <div className="max-w-xl mx-auto">
          <NetworkSearchBar onSearch={(val) => {
              setSearchTerm(val);
              // Clear domain selection if searching?
              if (val) {
                  setSelectedDomainId(null);
                  setSelectedSubTribeId(null);
              }
          }} />
        </div>

        {/* Domain Bar */}
        {!searchTerm && data && (
            <NetworkDomainBar 
                domains={data.domains.map(g => g.domain)} 
                selectedDomainId={selectedDomainId}
                onSelectDomain={(id) => {
                    setSelectedDomainId(id);
                    setSelectedSubTribeId(null); // Reset sub-selection
                }}
            />
        )}
        
        {/* Sub-Tribe Drawer */}
        {!searchTerm && selectedDomainGroup && (
            <NetworkSubTribeDrawer 
                isOpen={!!selectedDomainId}
                subTribes={selectedDomainGroup.subTribes}
                selectedSubTribeId={selectedSubTribeId}
                onSelectSubTribe={setSelectedSubTribeId}
                color={selectedDomainGroup.domain.color || '#6366f1'}
            />
        )}

        {/* Results View */}
        {(searchTerm || (selectedDomainId && selectedSubTribeId)) && (
          <TribeView 
            tribes={displayedTribes} 
            searchTerm={searchTerm || (selectedDomainGroup?.subTribes.find(s => s.id === selectedSubTribeId)?.name || '')} 
            onNurtureTribe={handleNurtureTribe} 
          />
        )}
        
        {/* Instructions / Empty State */}
        {!searchTerm && !selectedSubTribeId && selectedDomainId && (
            <div className="text-center py-20 animate-in fade-in zoom-in-95 duration-500">
                <p className="text-gray-400 text-lg">Select a category above to explore your {selectedDomainGroup?.domain.name} tribe.</p>
            </div>
        )}
      </div>

      <LogInteractionModal 
        isOpen={isNurtureModalOpen} 
        onClose={() => setIsNurtureModalOpen(false)} 
        tribe={nurtureTribe} 
      />

      <NetworkTutorial 
        isOpen={showTutorial}
        onClose={(dontShowAgain) => {
          setShowTutorial(false);
          if (dontShowAgain) {
            localStorage.setItem('hideTribeSearchTutorial', 'true');
          }
        }}
      />
    </div>
  );
}
