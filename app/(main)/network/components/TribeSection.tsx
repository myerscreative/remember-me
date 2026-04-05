'use client';

import { motion } from 'framer-motion';
import { NetworkCard } from './NetworkCard';
import { SubTribe } from './NetworkDataService';
import { Button } from '@/components/ui/button';
import { Sparkles, Users } from 'lucide-react';

interface TribeSectionProps {
  tribe: SubTribe;
  onNurtureTribe: (tribe: SubTribe) => void;
  searchTerm: string;
}

export function TribeSection({ tribe, onNurtureTribe, searchTerm }: TribeSectionProps) {
  // Use generic styling since SubTribe doesn't have a type property
  const gradient = 'from-violet-500/10 to-purple-500/10 border-violet-200';
  const titleColor = 'text-violet-700';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-3xl p-6 border backdrop-blur-sm bg-linear-to-br ${gradient} mb-8`}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl bg-surface/50 ${titleColor}`}>
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`text-xl font-bold ${titleColor}`}>
              {tribe.name}
            </h3>
            <p className="text-sm text-text-tertiary">
              {tribe.memberCount} members
            </p>
          </div>
        </div>

        <Button 
          onClick={() => onNurtureTribe(tribe)}
          variant="outline"
          className="bg-surface/50 hover:bg-surface/80 border-0 shadow-sm"
        >
          <Sparkles className="w-4 h-4 mr-2 text-amber-500" />
          Nurture Entire Tribe
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tribe.members.map(contact => (
          <NetworkCard 
            key={contact.id} 
            contact={contact} 
            highlight={searchTerm}
          />
        ))}
      </div>
    </motion.div>
  );
}
