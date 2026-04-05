'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { networkService, NetworkData, SubTribe } from './components/NetworkDataService';
import { LogInteractionModal } from './components/LogInteractionModal';
import { NetworkSearchView } from './components/NetworkSearchView';
import { NetworkInspectView } from './components/NetworkInspectView';
import { NetworkNurtureView } from './components/NetworkNurtureView';
import { GardenHub } from './components/GardenHub';
import { Loader2 } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

type ViewMode = 'search' | 'inspect' | 'nurture' | 'lore' | null;

function NetworkContent() {
  const [data, setData] = useState<NetworkData | null>(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();

  // URL-driven view state
  const activeView = (searchParams.get('view') as ViewMode) || (searchParams.get('has_lore') === 'true' ? 'search' : null);
  const initialSearchTerm = searchParams.get('has_lore') === 'true' ? 'has:lore' : ''; // Using a special prefix or similar

  // Nurture modal state
  const [nurtureTribe, setNurtureTribe] = useState<SubTribe | null>(null);
  const [isNurtureModalOpen, setIsNurtureModalOpen] = useState(false);

  const refreshData = useCallback(async () => {
    try {
      const networkData = await networkService.fetchNetworkData();
      setData(networkData);
    } catch (error) {
      console.error('Failed to load network data:', error);
    }
  }, []);

  useEffect(() => {
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

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-text-accent" />
      </div>
    );
  }

  // Sub-view active: render the appropriate tool view
  if (activeView && data) {
    return (
      <div className="min-h-screen bg-canvas p-3 md:p-8 flex flex-col">
        <div className="max-w-7xl mx-auto flex-1 w-full">
          <AnimatePresence mode="wait">
            {activeView === 'search' && (
              <NetworkSearchView
                key="search"
                data={data}
                onBack={handleBackToGarden}
                onNurtureTribe={handleNurtureTribe}
                onContactAdded={refreshData}
                initialSearchTerm={initialSearchTerm}
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

  // Default: Garden Hub landing page
  return (
    <div className="min-h-screen bg-canvas p-3 md:p-8 flex flex-col">
      <div className="flex-1 w-full">
        <GardenHub onNavigate={handleNavigateToView} />
      </div>
    </div>
  );
}

export default function NetworkPage() {
  return (
    <Suspense fallback={
       <div className="flex items-center justify-center min-h-screen bg-canvas">
          <Loader2 className="w-8 h-8 animate-spin text-text-accent" />
       </div>
    }>
       <NetworkContent />
    </Suspense>
  );
}
