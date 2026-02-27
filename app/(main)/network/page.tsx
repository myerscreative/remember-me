'use client';

import { useState, useEffect, useMemo, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { networkService, NetworkData, SubTribe } from './components/NetworkDataService';
import NetworkSearchBar from './components/NetworkSearchBar';
import { TribeView } from './components/TribeView';
import { LogInteractionModal } from './components/LogInteractionModal';
import { NetworkDomainBar } from './components/NetworkDomainBar';
import { NetworkSubTribeDrawer } from './components/NetworkSubTribeDrawer';
import { NetworkTutorial, TutorialButton } from './components/NetworkTutorial';
import { NetworkSearchView } from './components/NetworkSearchView';
import { NetworkInspectView } from './components/NetworkInspectView';
import { NetworkNurtureView } from './components/NetworkNurtureView';
import { Loader2 } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

type ViewMode = 'search' | 'inspect' | 'nurture' | null;

function NetworkContent() {
  const [data, setData] = useState<NetworkData | null>(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  
  // Tutorial State
  const [showTutorial, setShowTutorial] = useState(false);
  
  // URL-driven view state
  const activeView = (searchParams.get('view') as ViewMode) || null;

  // New Domain Logic
  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null);
  const [selectedSubTribeId, setSelectedSubTribeId] = useState<string | null>(null);

  const [nurtureTribe, setNurtureTribe] = useState<SubTribe | null>(null);
  const [isNurtureModalOpen, setIsNurtureModalOpen] = useState(false);

  useEffect(() => {
    // Check search params on mount or change
    const query = searchParams.get('search');
    if (query) {
      setSearchTerm(query);
    }

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
  }, [searchParams]);

  const handleNurtureTribe = useCallback((tribe: SubTribe) => {
    setNurtureTribe(tribe);
    setIsNurtureModalOpen(true);
  }, []);

  const handleNavigateToView = useCallback((view: ViewMode) => {
    if (view) {
      router.push(`/network?view=${view}`);
    } else {
      router.push('/network');
    }
  }, [router]);

  const handleBackToGarden = useCallback(() => {
    router.push('/network');
  }, [router]);
  
  // Derived state for the UI
  const selectedDomainGroup = useMemo(() => {
      if (!data || !selectedDomainId) return null;
      return data.domains.find(d => d.domain.id === selectedDomainId);
  }, [data, selectedDomainId]);
  
  // Transform selected SubTribe into format for TribeView
  const displayedTribes = useMemo(() => {
    if (!data) return [];

    // 1. Search Mode overrides everything
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
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
             return [subTribe];
        }
    }
    
    return [];
  }, [data, searchTerm, selectedDomainId, selectedSubTribeId, selectedDomainGroup]);


  if (loading) {
     return (
       <div className="flex h-screen items-center justify-center">
         <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
       </div>
     );
  }

  // If a sub-view is active, render that instead of the default garden map
  if (activeView && data) {
    return (
      <div className="min-h-screen bg-gray-50/50 dark:bg-black/20 p-3 md:p-8">
        <div className="max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            {activeView === 'search' && (
              <NetworkSearchView
                key="search"
                data={data}
                onBack={handleBackToGarden}
                onNurtureTribe={handleNurtureTribe}
              />
            )}
            {activeView === 'inspect' && (
              <NetworkInspectView
                key="inspect"
                data={data}
                onBack={handleBackToGarden}
                onNurtureTribe={handleNurtureTribe}
              />
            )}
            {activeView === 'nurture' && (
              <NetworkNurtureView
                key="nurture"
                data={data}
                onBack={handleBackToGarden}
              />
            )}
          </AnimatePresence>
        </div>

        <LogInteractionModal 
          isOpen={isNurtureModalOpen} 
          onClose={() => setIsNurtureModalOpen(false)} 
          tribe={nurtureTribe} 
        />
      </div>
    );
  }

  // Default: Garden Map view
  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-black/20 p-3 md:p-8">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">

        {/* Header Area */}
        <div className="text-center space-y-3 md:space-y-4 pt-4 md:pt-8 pb-3 md:pb-4 relative">
          <div className="absolute top-2 md:top-4 right-0">
            <TutorialButton onClick={() => setShowTutorial(true)} />
          </div>
          <h1 className="text-2xl md:text-4xl font-bold bg-clip-text text-transparent bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500">
            {selectedDomainGroup ? selectedDomainGroup.domain.name : 'Tribe Search'}
          </h1>
          {!selectedDomainGroup && !searchTerm && (
              <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 max-w-lg mx-auto px-4">
                Discover connections, nurture groups, and see your network as a living ecosystem.
              </p>
          )}
        </div>

        {/* Search Input */}
        <div className="max-w-xl mx-auto">
          <NetworkSearchBar onSearch={(val) => {
              setSearchTerm(val);
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
                    setSelectedSubTribeId(null);
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
        onNavigate={handleNavigateToView}
      />
    </div>
  );
}

export default function NetworkPage() {
  return (
    <Suspense fallback={
       <div className="flex items-center justify-center min-h-screen bg-[#0a0e1a]">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
       </div>
    }>
       <NetworkContent />
    </Suspense>
  );
}
