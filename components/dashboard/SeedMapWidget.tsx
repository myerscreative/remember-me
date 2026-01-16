'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Sprout } from 'lucide-react';
import { motion } from 'framer-motion';
import Seed, { getRelationshipLevel } from '@/components/relationship-garden/Seed';

// Constants for Fibonacci positioning
const GOLDEN_ANGLE = 137.5 * (Math.PI / 180);

interface SeedMapWidgetProps {
  contacts?: any[];
  className?: string;
  totalCount?: number;
  activeCount?: number;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  contact: { name: string; days: number; id: string; status: 'nurtured' | 'drifting' | 'neglected'; } | null;
}

function getContactStatus(days: number, importance: string = 'medium'): 'nurtured' | 'drifting' | 'neglected' {
  let threshold = 30;
  if (importance === 'high') threshold = 14;
  else if (importance === 'low') threshold = 90;

  if (days <= threshold) return 'nurtured';
  if (days <= threshold + 30) return 'drifting'; // Buffer for drifting
  return 'neglected';
}

function getColorForStatus(status: 'nurtured' | 'drifting' | 'neglected'): string {
  switch (status) {
    case 'nurtured': return '#059669'; // Emerald-600
    case 'drifting': return '#B45309'; // Amber-700 for high contrast
    case 'neglected': return '#DC2626'; // Red-600
  }
}

import { toast } from 'react-hot-toast';

// ... existing imports

export default function SeedMapWidget({ contacts = [], className = '', totalCount, activeCount: propActiveCount }: SeedMapWidgetProps) {
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, x: 0, y: 0, contact: null });
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [celebratingId, setCelebratingId] = useState<string | null>(null);
  
  // Track previous statuses to detect improvements
  const prevStatusesRef = React.useRef<Record<string, 'nurtured' | 'drifting' | 'neglected'>>({});

  // Seed positioning logic with dynamic sizing
  const { seedPositions, calculatedActiveCount } = useMemo(() => {
    // 1. Filter active contacts (having intensity/importance)
    const activeContacts = contacts.filter((c: any) => c.intensity);
    
    // Transform and sort active ones
    const displayContacts = activeContacts.map(c => {
        const lastDate = c.lastContact ? new Date(c.lastContact) : null;
        const now = new Date();
        const days = lastDate 
          ? Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
          : 999; // Treat no-history as "Oldest" (Outer Edge)
        
        const status = getContactStatus(days, c.importance);
        
        return { ...c, days, status };
    })
    .sort((a, b) => a.days - b.days) // Sort by recency (Green center -> Orange edge)
    .slice(0, 400); 

    const count = displayContacts.length;
    // Dynamic scaling - smaller dots with more spread for organic look
    const spacing = 16; 
    let spiralConstant = 8; // Increased for more spread
    let seedSize = 4; // Much smaller for delicate appearance

    if (count < 50) {
        seedSize = 5; // Small even with few contacts
        spiralConstant = 10; // More spread
    } else if (count < 100) {
        seedSize = 4.5; // Medium-small
        spiralConstant = 9;
    } else {
        seedSize = 3; // Very small for many contacts
        spiralConstant = 8;
    }

    const positions = displayContacts.map((contact, i) => {
      // Fibonacci Spiral: r = c * sqrt(n), theta = n * 137.5 deg
      const n = i; // Ensure center start
      const radius = spiralConstant * Math.sqrt(n);
      const angle = n * 137.508 * (Math.PI / 180);
      
      const x = 150 + radius * Math.cos(angle);
      const y = 150 + radius * Math.sin(angle);
      
      return { ...contact, x, y, size: seedSize, color: getColorForStatus(contact.status) };
    });

    return { seedPositions: positions, calculatedActiveCount: count };
  }, [contacts]);

  // Effect to detect status improvements
  React.useEffect(() => {
    const currentStatuses: Record<string, 'nurtured' | 'drifting' | 'neglected'> = {};
    
    seedPositions.forEach(seed => {
      currentStatuses[seed.id] = seed.status;
      
      const prevStatus = prevStatusesRef.current[seed.id];
      // Check for Transition: Drifting/Neglected -> Nurtured
      if (prevStatus && (prevStatus === 'drifting' || prevStatus === 'neglected') && seed.status === 'nurtured') {
         // Trigger Celebration
         setCelebratingId(seed.id);
         
         // Toast Notification
         toast.custom((t) => (
            <div
              className={`${
                t.visible ? 'animate-enter' : 'animate-leave'
              } max-w-md w-full bg-emerald-50 border-2 border-emerald-200 shadow-lg rounded-xl pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
            >
              <div className="flex-1 w-0 p-4">
                <div className="flex items-start">
                  <div className="shrink-0 pt-0.5">
                    <Sprout className="h-10 w-10 text-emerald-500" />
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-bold text-emerald-900">
                      Connection Restored!
                    </p>
                    <p className="mt-1 text-sm text-emerald-700">
                      You've nurtured your bond with <span className="font-bold">{seed.name}</span>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
         ), { duration: 4000, position: 'bottom-center' });

         // Clear celebration animation after 2s
         setTimeout(() => setCelebratingId(null), 2500);
      }
    });

    // Update ref
    prevStatusesRef.current = currentStatuses;
  }, [seedPositions]);

  const displayActiveCount = propActiveCount ?? calculatedActiveCount;
  const displayTotalCount = totalCount ?? contacts.length;

  const getTooltipText = (contact: NonNullable<TooltipState['contact']>) => {
      if (contact.days === 999) return "Ready for first hello.";
      switch (contact.status) {
          case 'nurtured': return `${contact.name} is Nurtured. Connection is solid.`;
          case 'drifting': return `${contact.name} is Drifting. Reach out to pull them back.`;
          case 'neglected': return `${contact.name} is Neglected. This connection needs a rescue.`;
      }
  };

  return (
    <div className={`relative flex flex-col p-4 bg-card rounded-xl border border-border/50 min-h-[380px] w-full max-w-full overflow-hidden ${className}`}>
      {/* Title */}
      <div className="flex items-center gap-2 mb-4 md:absolute md:top-4 md:left-4 md:mb-0 z-10">
        <Sprout className="h-5 w-5 text-emerald-500 shrink-0" />
        <span className="font-bold text-sm tracking-wide text-foreground/80 uppercase">Garden Map</span>
      </div>

      {/* SVG Map - Centered */}
      <div className="flex-1 flex items-center justify-center w-full min-h-[300px]">
         {displayActiveCount > 0 ? (
            <div className="relative flex items-center justify-center w-full h-full">
              <svg width="300" height="300" viewBox="0 0 300 300" className="overflow-visible max-w-full h-auto">
                <defs>
                   <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="2" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                   </filter>
                </defs>
                
                {/* Center Marker */}
                <circle cx="150" cy="150" r="2" fill="currentColor" className="text-muted-foreground/20" />

                {/* Seeds */}
                {seedPositions.map((seed) => (
                  <motion.circle
                    key={seed.id}
                    cx={seed.x}
                    cy={seed.y}
                    r={seed.size}
                    fill={seed.color}
                    initial={false}
                    animate={{
                        r: celebratingId === seed.id ? seed.size * 2.5 : (hoveredId === seed.id ? seed.size * 1.5 : seed.size),
                        opacity: 1,
                        scale: celebratingId === seed.id ? [1, 1.5, 1] : 1,
                    }}
                    transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 15,
                        scale: {
                            repeat: celebratingId === seed.id ? 3 : 0, 
                            duration: 0.6
                        }
                    }}
                    className={`cursor-pointer ${hoveredId === seed.id ? 'stroke-white dark:stroke-slate-900 stroke-2 z-50' : 'hover:opacity-80'}`}
                    onMouseEnter={(e: any) => {
                       setHoveredId(seed.id);
                       setTooltip({ visible: true, x: e.clientX, y: e.clientY, contact: seed });
                    }}
                    onMouseLeave={() => {
                       setHoveredId(null);
                       setTooltip({ ...tooltip, visible: false });
                    }}
                  />
                ))}
              </svg>
           </div>
         ) : (
            // EMPTY STATE FAILSAFE: Only show if activeCount === 0
            <div className="flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-500">
               <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
                  <Sprout className="h-8 w-8 text-emerald-600" />
               </div>
               <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                   Start <span className="font-bold text-emerald-500">Quick Sort</span> to see your<br/>garden grow
               </p>
            </div>
         )}

         {/* Tooltip */}
         {tooltip.visible && tooltip.contact && (
            <div 
              className="fixed z-50 px-3 py-2 bg-slate-900/95 text-white text-xs rounded-lg shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-[140%] backdrop-blur-sm border border-slate-700 min-w-[200px] text-center"
              style={{ left: tooltip.x, top: tooltip.y }}
            >
              <div className="font-bold text-sm mb-0.5">{tooltip.contact.name}</div>
              <div className="text-slate-300 text-[11px] leading-tight">
                {getTooltipText(tooltip.contact)}
              </div>
            </div>
         )}
      </div>

      {/* Footer: Stats + Legend - Below map on mobile, absolute on desktop */}
      <div className="mt-4 pt-4 border-t border-border/30 w-full flex flex-col md:flex-row items-center justify-between gap-4 md:absolute md:bottom-4 md:right-4 md:mt-0 md:pt-0 md:border-t-0 md:w-auto">
         {/* Legend - Stays as a row or wraps naturally */}
         <div className="flex flex-wrap items-center justify-center gap-4 text-[10px] font-bold order-2 md:order-1">
            <div className="flex items-center gap-1.5">
               <span className="w-2.5 h-2.5 rounded-full bg-[#059669]"></span>
               <span className="text-foreground/80 dark:text-emerald-400 whitespace-nowrap">Nurtured</span>
            </div>
            <div className="flex items-center gap-1.5">
               <span className="w-2.5 h-2.5 rounded-full bg-[#B45309]"></span>
               <span className="text-foreground/80 dark:text-amber-400 whitespace-nowrap">Drifting</span>
            </div>
            <div className="flex items-center gap-1.5">
               <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]"></span>
               <span className="text-foreground/80 dark:text-rose-400 whitespace-nowrap">Neglected</span>
            </div>
         </div>

         {/* Stats - Centered on mobile */}
         <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest bg-muted/50 px-3 py-1.5 rounded-md order-1 md:order-2 w-full md:w-auto text-center">
            {displayTotalCount} TOTAL / <span className="text-emerald-500">{displayActiveCount} ACTIVE</span>
         </div>
      </div>
    </div>
  );
}
