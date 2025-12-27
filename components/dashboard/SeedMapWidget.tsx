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
  contact: { name: string; days: number; id: string } | null; // Added id to contact
}

function getColorForDays(days: number): string {
  // STRICT VISUAL LOGIC: Map Fresh (Green), Warn (Yellow), Alert (Orange)
  if (days <= 30) return '#10B981';   // Emerald-500 (Fresh / Center)
  if (days <= 90) return '#EAB308';   // Yellow-500 (Warn / Mid)
  return '#F97316';                   // Orange-500 (Alert / No History / Edge)
}

export default function SeedMapWidget({ contacts = [], className = '', totalCount, activeCount: propActiveCount }: SeedMapWidgetProps) {
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, x: 0, y: 0, contact: null });
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Seed positioning logic with dynamic sizing
  const { seedPositions, calculatedActiveCount } = useMemo(() => {
    // 1. Filter active contacts (having intensity/importance)
    // Upstream fix ensures 'intensity' is set for anyone with history
    const activeContacts = contacts.filter((c: any) => c.intensity);
    
    // Transform and sort active ones
    const displayContacts = activeContacts.map(c => {
        const lastDate = c.lastContact ? new Date(c.lastContact) : null;
        const now = new Date();
        const days = lastDate 
          ? Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
          : 999; // Treat no-history as "Oldest" (Outer Edge)
        return { ...c, days };
    })
    .sort((a, b) => a.days - b.days) // Sort by recency (Green center -> Orange edge)
    .slice(0, 400); 

    const count = displayContacts.length;
    // Dynamic scaling based on count
    // If few active contacts, spread them out more. If many, pack them tighter.
    const spacing = 16; 
    let spiralConstant = 5; 
    let seedSize = 5;

    if (count < 50) {
        seedSize = 8;
        spiralConstant = 7;
    } else if (count < 100) {
        seedSize = 6;
        spiralConstant = 6;
    }

    const positions = displayContacts.map((contact, i) => {
      // Fibonacci Spiral: r = c * sqrt(n), theta = n * 137.5 deg
      const n = i; // Ensure center start
      const radius = spiralConstant * Math.sqrt(n);
      const angle = n * 137.508 * (Math.PI / 180);
      
      const x = 150 + radius * Math.cos(angle);
      const y = 150 + radius * Math.sin(angle);
      
      return { ...contact, x, y, size: seedSize, color: getColorForDays(contact.days) };
    });

    return { seedPositions: positions, calculatedActiveCount: count };
  }, [contacts]);

  const displayActiveCount = propActiveCount ?? calculatedActiveCount;
  const displayTotalCount = totalCount ?? contacts.length;

  return (
    <div className={`relative flex flex-col items-center justify-center p-4 bg-card rounded-xl border border-border/50 h-[380px] w-full ${className}`}>
      {/* Title */}
      <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
        <Sprout className="h-5 w-5 text-lime-500" />
        <span className="font-bold text-sm tracking-wide text-foreground/80 uppercase">Garden Map</span>
      </div>

      {/* SVG Map */}
      <div className="relative w-[300px] h-[300px] flex items-center justify-center">
         {displayActiveCount > 0 ? (
            <svg width="300" height="300" viewBox="0 0 300 300" className="overflow-visible">
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
                <circle
                  key={seed.id}
                  cx={seed.x}
                  cy={seed.y}
                  r={hoveredId === seed.id ? seed.size * 1.5 : seed.size}
                  fill={seed.color}
                  className={`transition-all duration-300 ease-out cursor-pointer ${hoveredId === seed.id ? 'stroke-white dark:stroke-slate-900 stroke-2 z-50' : 'hover:opacity-80'}`}
                  onMouseEnter={(e) => {
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
              className="fixed z-50 px-3 py-2 bg-slate-900/95 text-white text-xs rounded-lg shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-[140%] backdrop-blur-sm border border-slate-700"
              style={{ left: tooltip.x, top: tooltip.y }}
            >
              <div className="font-bold">{tooltip.contact.name}</div>
              <div className="text-slate-400 text-[10px] uppercase tracking-wider">{tooltip.contact.days === 999 ? 'New / No History' : `${tooltip.contact.days} Days Ago`}</div>
            </div>
         )}
      </div>

      {/* Footer Stats - DYNAMIC & SYNCHRONIZED */}
      <div className="absolute bottom-4 right-4 flex items-center gap-3">
         <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted/50 px-2 py-1 rounded-md">
            {displayTotalCount} TOTAL / <span className="text-emerald-500">{displayActiveCount} ACTIVE</span>
         </div>
      </div>
    </div>
  );
}
