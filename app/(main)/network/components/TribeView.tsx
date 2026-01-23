'use client';

import { SubTribe } from './NetworkDataService';
import { TribeSection } from './TribeSection';
import { motion, AnimatePresence } from 'framer-motion';

interface TribeViewProps {
  tribes: SubTribe[];
  searchTerm: string;
  onNurtureTribe: (tribe: SubTribe) => void;
}

export function TribeView({ tribes, searchTerm, onNurtureTribe }: TribeViewProps) {
  if (tribes.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">No tribes found matching "{searchTerm}"</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <AnimatePresence>
        {tribes.map(tribe => (
          <TribeSection 
            key={tribe.id} 
            tribe={tribe} 
            onNurtureTribe={onNurtureTribe} 
            searchTerm={searchTerm}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
