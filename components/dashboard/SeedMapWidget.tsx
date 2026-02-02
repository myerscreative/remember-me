'use client';

import React, { useMemo, useState } from 'react';
import { Sprout } from 'lucide-react';

// Constants
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
  contact: any | null;
}

// Color logic similar to RelationshipGarden but simplified for dashboard widget
function getColorForDays(days: number): string {
  if (days <= 14) return '#10b981';   // Green - Blooming
  if (days <= 45) return '#84cc16';   // Lime - Nourished
  if (days <= 120) return '#fbbf24';  // Yellow - Thirsty
  return '#f97316';                   // Orange - Fading
}

function getStatusLabel(days: number): string {
  if (days <= 14) return 'Blooming';
  if (days <= 45) return 'Nourished';
  if (days <= 120) return 'Thirsty';
  return 'Fading';
}

function adjustBrightness(color: string, percent: number) {
  const num = parseInt(color.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, Math.min(255, (num >> 16) + amt));
  const G = Math.max(0, Math.min(255, (num >> 8 & 0x00FF) + amt));
  const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt));
  return "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

export default function SeedMapWidget({ contacts = [], className = '', totalCount, activeCount: propActiveCount }: SeedMapWidgetProps) {
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, x: 0, y: 0, contact: null });
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Layout Logic (Ported & Scaled from RelationshipGarden)
  const { leafPositions, calculatedActiveCount } = useMemo(() => {
    // 1. Filter active contacts
    const activeContacts = contacts.slice(0, 400); // Limit for performance

    const getDays = (c: any) => {
        const lastDate = c.last_interaction_date ? new Date(c.last_interaction_date) : null;
        const now = new Date();
        return lastDate 
          ? Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
          : 999;
    };

    // Bucket contacts
    const buckets = {
      high: [] as any[],    // <= 14 days (or high importance/freq)
      medium: [] as any[],  // <= 45 days
      low: [] as any[],     // > 45 days
    };

    activeContacts.forEach(contact => {
      const days = getDays(contact);
      const targetFreq = contact.target_frequency_days || 30; // Default
      
      // Use buckets similar to Garden:
      // High: Frequent contact needed or very recent
      const isHigh = (targetFreq <= 14) || (days <= 14); 
      const isMed = (targetFreq <= 45 && targetFreq > 14) || (days <= 45 && days > 14);

      if (isHigh) buckets.high.push({ ...contact, days });
      else if (isMed) buckets.medium.push({ ...contact, days });
      else buckets.low.push({ ...contact, days });
    });

    // Helper to distribute in ring
    const calculateRingPositions = (items: any[], minRadius: number, maxRadius: number, startAngleOffset: number) => {
      // Deterministic Jitter Helper
      const getJitter = (id: string, seed: string) => {
          const str = (id || '') + seed;
          let hash = 0;
          for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
          return hash;
      };

      // Sort by recency (inner -> outer)
      const sorted = [...items].sort((a, b) => a.days - b.days);
      const count = sorted.length;

      return sorted.map((contact, i) => {
         const normalizedPos = i / Math.max(1, count - 1);
         // Slightly randomize base radius within ring to avoid perfect lines
         const baseRadius = minRadius + (maxRadius - minRadius) * normalizedPos;
         
         const jitterAmount = (maxRadius - minRadius) * 0.15;
         const jitter = (getJitter(contact.id, 'radius') % 1000) / 1000 - 0.5;
         const radius = baseRadius + (jitter * jitterAmount);

         const angle = i * GOLDEN_ANGLE + startAngleOffset;
         
         const cx = 150 + Math.cos(angle) * radius;
         const cy = 150 + Math.sin(angle) * radius;
         
         // Leaf rotation (pointing outward from center)
         const rotation = (Math.atan2(cy - 150, cx - 150) * 180 / Math.PI);
         const rotJitter = (getJitter(contact.id, 'rot') % 30) - 15;

         // Initials
         const initials = (contact.name || "?").split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

         return {
             ...contact,
             x: cx,
             y: cy,
             radius, 
             rotation: rotation + 90 + rotJitter, 
             color: getColorForDays(contact.days),
             initials,
             scale: count > 100 ? 0.35 : 0.45 
         };
      });
    };

    // Define Rings (Radii 0-150) to fit in 300x300
    const p1 = calculateRingPositions(buckets.high, 20, 55, 0); 
    const p2 = calculateRingPositions(buckets.medium, 70, 105, p1.length * GOLDEN_ANGLE);
    const p3 = calculateRingPositions(buckets.low, 115, 140, (p1.length + p2.length) * GOLDEN_ANGLE);

    return { 
        leafPositions: [...p1, ...p2, ...p3],
        calculatedActiveCount: contacts.length
    };
  }, [contacts]);


  const displayActiveCount = propActiveCount ?? calculatedActiveCount;
  const displayTotalCount = totalCount ?? contacts.length;

  return (
    <div className={`relative flex flex-col p-4 bg-card rounded-xl border border-border/50 min-h-[380px] w-full max-w-full overflow-hidden ${className}`}>
      {/* Title */}
      <div className="flex items-center gap-2 mb-4 md:absolute md:top-4 md:left-4 md:mb-0 z-10 pointer-events-none">
        <Sprout className="h-5 w-5 text-emerald-500 shrink-0" />
        <span className="font-bold text-sm tracking-wide text-foreground/80 uppercase">Garden Map</span>
      </div>

      {/* SVG Map */}
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
                
                {/* Guide Rings (Background) */}
                <circle cx="150" cy="150" r="55" fill="none" stroke="currentColor" strokeOpacity="0.05" strokeWidth="1" />
                <circle cx="150" cy="150" r="105" fill="none" stroke="currentColor" strokeOpacity="0.05" strokeWidth="1" />
                <circle cx="150" cy="150" r="140" fill="none" stroke="currentColor" strokeOpacity="0.05" strokeWidth="1" />

                {/* Center Marker */}
                <circle cx="150" cy="150" r="2" fill="currentColor" className="text-muted-foreground/20" />

                {/* Leaves */}
                {leafPositions.map((leaf) => {
                   const isHovered = hoveredId === leaf.id;
                   const leafScale = isHovered ? leaf.scale * 1.5 : leaf.scale;
                   const darkerColor = adjustBrightness(leaf.color, -30);
                   
                   return (
                    <g 
                        key={leaf.id}
                        transform={`translate(${leaf.x}, ${leaf.y}) rotate(${leaf.rotation - 90}) scale(${leafScale})`} // -90 adjustment because path points 'Up' but atan2 is from 'Right'
                        className="cursor-pointer transition-all duration-300"
                        onMouseEnter={(e: any) => {
                             setHoveredId(leaf.id);
                             setTooltip({ visible: true, x: e.clientX, y: e.clientY, contact: leaf });
                        }}
                        onMouseLeave={() => {
                             setHoveredId(null);
                             setTooltip(prev => ({ ...prev, visible: false }));
                        }}
                    >
                         {/* Leaf Shape - Path from Leaf.tsx */}
                         <g transform="translate(-21, -24)"> 
                            <path
                              d="M 21 46 C 14 42, 6 36, 4 24 C 4 14, 9 6, 21 2 C 33 6, 38 14, 38 24 C 36 36, 28 42, 21 46 Z"
                              fill={leaf.color}
                              stroke={darkerColor}
                              strokeWidth="2"
                              className="transition-colors duration-300"
                            />
                            {/* Vein */}
                            <path
                              d="M 21 43 L 21 6"
                              stroke={darkerColor}
                              strokeWidth="2"
                              fill="none"
                              opacity="0.4"
                            />
                            {/* Initials Text - Rotated back for readability */}
                            <text
                                x="21"
                                y="28"
                                textAnchor="middle"
                                fill="white"
                                fontSize="16"
                                fontWeight="bold"
                                className="pointer-events-none select-none drop-shadow-md"
                                transform={`rotate(${-leaf.rotation + 90}, 21, 24)`} 
                            >
                                {leaf.initials}
                            </text>
                         </g>
                    </g>
                   );
                })}
              </svg>
           </div>
         ) : (
            <div className="flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-500">
               <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
                  <Sprout className="h-8 w-8 text-emerald-600" />
               </div>
               <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                   Start adding contact context to see your<br/>garden grow
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
              <div className="text-slate-300 text-[11px] leading-tight mb-1">
                Last contact: {tooltip.contact.days === 999 ? 'Never' : `${tooltip.contact.days} days ago`}
              </div>
              <div className={`text-[10px] font-bold uppercase tracking-wider inline-block px-1.5 py-0.5 rounded bg-white/10 text-${tooltip.contact.color === '#10b981' ? 'emerald' : tooltip.contact.color === '#84cc16' ? 'lime' : tooltip.contact.color === '#fbbf24' ? 'amber' : 'orange'}-400`}>
                  {getStatusLabel(tooltip.contact.days)}
              </div>
            </div>
         )}
      </div>

      {/* Footer: Stats + Legend */}
      <div className="mt-4 pt-4 border-t border-border/30 w-full flex flex-col md:flex-row items-center justify-between gap-4 md:absolute md:bottom-4 md:right-4 md:mt-0 md:pt-0 md:border-t-0 md:w-auto">
         {/* Legend */}
         <div className="flex flex-wrap items-center justify-center gap-3 text-[10px] font-bold order-2 md:order-1">
            <div className="flex items-center gap-1.5">
               <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></span>
               <span className="text-foreground/80 dark:text-emerald-400 whitespace-nowrap">Blooming</span>
            </div>
            <div className="flex items-center gap-1.5">
               <span className="w-2.5 h-2.5 rounded-full bg-[#84cc16]"></span>
               <span className="text-foreground/80 dark:text-lime-400 whitespace-nowrap">Nourished</span>
            </div>
            <div className="flex items-center gap-1.5">
               <span className="w-2.5 h-2.5 rounded-full bg-[#fbbf24]"></span>
               <span className="text-foreground/80 dark:text-amber-400 whitespace-nowrap">Thirsty</span>
            </div>
            <div className="flex items-center gap-1.5">
               <span className="w-2.5 h-2.5 rounded-full bg-[#f97316]"></span>
               <span className="text-foreground/80 dark:text-orange-400 whitespace-nowrap">Fading</span>
            </div>
         </div>

         {/* Stats */}
         <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest bg-muted/50 px-3 py-1.5 rounded-md order-1 md:order-2 w-full md:w-auto text-center">
            {displayTotalCount} TOTAL / <span className="text-emerald-500">{displayActiveCount} ACTIVE</span>
         </div>
      </div>
    </div>
  );
}
