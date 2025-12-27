'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Seed, { getRelationshipLevel } from '@/components/relationship-garden/Seed';

// Constants for Fibonacci positioning
const GOLDEN_ANGLE = 137.5 * (Math.PI / 180);

interface SeedMapWidgetProps {
  contacts?: any[];
  className?: string;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  contact: { name: string; days: number } | null;
}

function getColorForDays(days: number): string {
  if (days <= 14) return '#10b981';   // Green - Blooming
  if (days <= 45) return '#84cc16';   // Lime - Nourished
  if (days <= 120) return '#fbbf24';  // Yellow - Thirsty
  return '#f97316';                   // Orange - Fading
}

export default function SeedMapWidget({ contacts = [], className = '' }: SeedMapWidgetProps) {
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, x: 0, y: 0, contact: null });
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Seed positioning logic with dynamic sizing
  const seedPositions = useMemo(() => {
    // Transform and sort
    const displayContacts = contacts.map(c => {
        const lastDate = c.lastContact ? new Date(c.lastContact) : null;
        const now = new Date();
        const days = lastDate 
          ? Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
          : 999;
        return { ...c, days };
    })
    .sort((a, b) => a.days - b.days)
    .slice(0, 400); // Dense map

    const count = displayContacts.length;
    
    // Dense packing constants
    // const seedSize = count > 100 ? 3 : 5;
    const seedSize = 4;
    const spiralConstant = 3.5; 

    return displayContacts.map((contact, i) => {
      const radius = spiralConstant * Math.sqrt(i + 1); 
      const angle = i * GOLDEN_ANGLE;
      
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      const color = getColorForDays(contact.days);

      return { contact, x, y, color, seedSize };
    });
  }, [contacts]);

  const handleMouseEnter = (e: React.MouseEvent, contact: { name: string; days: number }) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setTooltip({
      visible: true,
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
      contact
    });
    setHoveredId(contact.name);
  };

  const handleMouseLeave = () => {
    setTooltip({ visible: false, x: 0, y: 0, contact: null });
    setHoveredId(null);
  };

  return (
    <div className={`block bg-[#0B1120] rounded-xl border border-slate-800 shadow-sm overflow-hidden ${className}`}>
      <Link href="/garden" className="block p-4 hover:bg-white/5 transition-colors relative group">
        
        {/* Title Overlay */}
        <div className="absolute top-4 left-4 z-10 pointer-events-none">
             <div className="flex items-center gap-2">
                <span className="text-lg">🌱</span>
                <h3 className="text-sm font-bold text-white tracking-tight uppercase opacity-80 group-hover:opacity-100 transition-opacity">Garden Map</h3>
             </div>
        </div>

        {/* Mini Garden Visualization - Seeds */}
        <div className="relative h-48 flex items-center justify-center">
            {/* Center glow */}
            <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-emerald-500/10 blur-xl rounded-full transform -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

          <div className="absolute top-1/2 left-1/2 w-0 h-0">
            {seedPositions.map(({ contact, x, y, color, seedSize }) => (
              <motion.div
                key={contact.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1, x, y }}
                transition={{ delay: 0.002 * seedPositions.indexOf({ contact, x, y, color, seedSize }) }}
                className="absolute rounded-full"
                style={{ 
                    marginLeft: -seedSize / 2, 
                    marginTop: -seedSize / 2,
                    width: seedSize,
                    height: seedSize,
                    backgroundColor: color,
                    boxShadow: hoveredId === contact.name ? `0 0 8px ${color}` : 'none',
                    zIndex: hoveredId === contact.name ? 50 : 1
                }}
                onMouseEnter={(e) => handleMouseEnter(e, contact.contact)}
                onMouseLeave={handleMouseLeave}
              />
            ))}
          </div>

          {/* Micro-tooltip */}
          {tooltip.visible && tooltip.contact && (
            <div 
              className="fixed z-50 bg-slate-900/95 text-white text-xs px-2 py-1 rounded-md shadow-lg pointer-events-none whitespace-nowrap border border-slate-700"
              style={{ 
                left: tooltip.x, 
                top: tooltip.y,
                transform: 'translate(-50%, -100%)'
              }}
            >
              <div className="font-bold text-emerald-400">{tooltip.contact.name}</div>
              <div className="text-[10px] text-slate-300">{getRelationshipLevel(tooltip.contact.days)}</div>
            </div>
          )}
        </div>
        
        {/* Footer info */}
        <div className="absolute bottom-2 right-4 text-[10px] text-slate-600 font-mono">
            {contacts.length} SEEDS
        </div>
      </Link>
    </div>
  );
}
