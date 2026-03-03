"use client"

import { motion } from 'framer-motion';
import { useGardenPhysics, ContactStatus } from '@/hooks/useGardenPhysics';

interface SeedlingProps {
  id: string;
  name: string;
  status: ContactStatus;
  index: number;
}

export const Seedling = ({ name, status, index }: SeedlingProps) => {
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
      className="absolute cursor-pointer group"
    >
      {/* The Contact Avatar */}
      <div className={`
        relative h-12 w-12 rounded-full border-2 flex items-center justify-center font-bold text-xs
        ${status === 'Nurtured' ? 'border-emerald-400 bg-slate-900 text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)]' : 
          status === 'Drifting' ? 'border-orange-400 bg-slate-900 text-orange-400' : 
          'border-red-500/50 bg-slate-950 text-slate-500'}
      `}>
        {name.split(' ').map(n => n[0]).join('')}
        
        {/* Tooltip on Hover */}
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-slate-800 px-2 py-1 rounded text-[10px] text-white z-10 pointer-events-none">
          {name} • {status}
        </div>
      </div>
    </motion.div>
  );
};
