"use client"

import { motion } from 'framer-motion';
import { useGardenPhysics, ContactStatus } from '@/hooks/useGardenPhysics';
import { SeedTooltip } from './SeedTooltip';

interface SeedlingProps {
  id: string;
  name: string;
  status: ContactStatus;
  index: number;
  daysSinceLastContact: number;
  lastInteractionType: string;
  isActive?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

export const Seedling = ({ 
  id,
  name, 
  status, 
  index, 
  daysSinceLastContact,
  lastInteractionType,
  isActive,
  onClick 
}: SeedlingProps) => {
  const { x, y } = useGardenPhysics(status, index);

  return (
    <motion.div
      layout // This handles the "Snap" animation automatically
      initial={false}
      animate={{ 
        x, 
        y,
        scale: status === 'Nurtured' ? 1.2 : status === 'Drifting' ? 1.0 : 0.8,
        opacity: status === 'Neglected' ? 0.6 : 1
      }}
      transition={{ 
        type: "spring", 
        stiffness: 70, 
        damping: 15,
        mass: 1 
      }}
      className={`absolute cursor-pointer group ${isActive ? 'z-50' : 'z-10'}`}
      onClick={onClick}
    >
      {/* The Contact Avatar */}
      <div className={`
        relative h-12 w-12 rounded-full border-2 flex items-center justify-center font-bold text-xs
        ${status === 'Nurtured' ? 'border-emerald-400 bg-slate-900 text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)]' : 
          status === 'Drifting' ? 'border-orange-400 bg-slate-900 text-orange-400' : 
          'border-red-500/50 bg-slate-950 text-slate-500'}
        ${isActive ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-950' : ''}
      `}>
        {name.split(' ').map(n => n[0]).join('')}
        
        {/* Active Tooltip (Tap/Click) */}
        {isActive && (
          <SeedTooltip 
            data={{
              contactId: id,
              name,
              status,
              daysSinceLastContact,
              lastInteractionType
            }}
          />
        )}
      </div>
    </motion.div>
  );
};
