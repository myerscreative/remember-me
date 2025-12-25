'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Seed, { getRelationshipLevel } from '@/components/relationship-garden/Seed';

// Constants for Fibonacci positioning
const GOLDEN_ANGLE = 137.5 * (Math.PI / 180);

interface GardenLeafWidgetProps {
  contacts?: ContactData[];
  className?: string;
}

interface ContactData {
  id: string;
  name: string;
  lastContact?: string | null;
  tags?: string[];
  importance?: 'high' | 'medium' | 'low';
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  contact: { name: string; days: number } | null;
}

// Transform dashboard contacts to garden format
function transformContacts(contacts: ContactData[]) {
  return contacts.map(contact => {
    // Calculate days since
    const lastDate = contact.lastContact ? new Date(contact.lastContact) : null;
    const now = new Date();
    const days = lastDate 
      ? Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    const initials = contact.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    return {
      id: contact.id,
      name: contact.name,
      initials,
      days,
      importance: contact.importance || 'medium'
    };
  });
}

function getColorForDays(days: number): string {
  if (days <= 14) return '#10b981';   // Green - Blooming
  if (days <= 45) return '#84cc16';   // Lime - Nourished
  if (days <= 120) return '#fbbf24';  // Yellow - Thirsty
  return '#f97316';                   // Orange - Fading
}

export default function GardenLeafWidget({ contacts = [], className = '' }: GardenLeafWidgetProps) {
  const transformedContacts = useMemo(() => transformContacts(contacts), [contacts]);
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, x: 0, y: 0, contact: null });
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  
  // Calculate stats
  const stats = useMemo(() => {
    const s = {
      healthy: 0,
      warning: 0,
      dying: 0,
      dormant: 0,
      score: 0
    };
    
    transformedContacts.forEach(c => {
      if (c.days <= 14) s.healthy++;
      else if (c.days <= 45) s.warning++;
      else if (c.days <= 120) s.dying++;
      else s.dormant++;
    });

    // Simple health score logic
    const total = transformedContacts.length || 1;
    s.score = Math.round(((s.healthy * 100) + (s.warning * 70) + (s.dying * 40) + (s.dormant * 10)) / total);
    
    return s;
  }, [transformedContacts]);

  const needingAttention = stats.dying + stats.dormant;

  // Seed positioning logic with dynamic sizing
  const seedPositions = useMemo(() => {
    const displayContacts = [...transformedContacts]
      .sort((a, b) => a.days - b.days)
      .slice(0, 300); // Higher limit for seeds since they're smaller

    const count = displayContacts.length;
    
    // Dynamic seed size based on contact count
    const seedSize = count > 100 ? 4 : count > 50 ? 5 : 6;
    
    // Spiral packing - tighter constant for small dots
    const spiralConstant = Math.max(2.5, 4.0 * Math.pow(30 / Math.max(30, count), 0.3));

    return displayContacts.map((contact, i) => {
      const radius = spiralConstant * Math.sqrt(i + 1); 
      const angle = i * GOLDEN_ANGLE;
      
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      const color = getColorForDays(contact.days);

      return { contact, x, y, color, seedSize };
    });
  }, [transformedContacts]);

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
    <div className={`block bg-linear-to-br from-emerald-50/50 to-teal-100/30 dark:from-[#0B1120] dark:to-[#0F172A] rounded-2xl border border-emerald-100 dark:border-emerald-800/30 shadow-sm overflow-hidden ${className}`}>
      <Link href="/garden" className="block p-5 hover:bg-white/20 dark:hover:bg-white/5 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌱</span>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 tracking-tight">Relationship Garden</h3>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
        
        {/* Mini Garden Visualization - Seeds */}
        <div className="relative h-48 mb-4 flex items-center justify-center bg-[#0B1120] rounded-xl overflow-hidden">
          <div className="absolute top-1/2 left-1/2 w-0 h-0">
            {seedPositions.map(({ contact, x, y, color, seedSize }) => (
              <motion.div
                key={contact.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1, x, y }}
                transition={{ delay: 0.005 * seedPositions.indexOf({ contact, x, y, color, seedSize }) }}
                className="absolute"
                style={{ marginLeft: -seedSize / 2, marginTop: -seedSize / 2 }}
              >
                <Seed 
                  color={color} 
                  size={seedSize}
                  isHighlighted={hoveredId === contact.name}
                  onMouseEnter={(e) => handleMouseEnter(e, contact)}
                  onMouseLeave={handleMouseLeave}
                />
              </motion.div>
            ))}
          </div>

          {/* Micro-tooltip */}
          {tooltip.visible && tooltip.contact && (
            <div 
              className="fixed z-50 bg-slate-900/95 text-white text-xs px-2 py-1 rounded-md shadow-lg pointer-events-none whitespace-nowrap"
              style={{ 
                left: tooltip.x, 
                top: tooltip.y,
                transform: 'translate(-50%, -100%)'
              }}
            >
              <div className="font-medium">{tooltip.contact.name}</div>
              <div className="text-[10px] opacity-75">{getRelationshipLevel(tooltip.contact.days)}</div>
            </div>
          )}
        </div>
        
        {/* Health Score & Stats */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Garden Health</span>
            <div className="flex items-center gap-2">
              <span className="font-black text-2xl text-gray-900 dark:text-white">{stats.score}</span>
              <span className="text-xs text-gray-400 font-bold">/100</span>
            </div>
          </div>
          
          <div className="flex justify-between gap-1.5">
            <StatBadge color="#10b981" count={stats.healthy} />
            <StatBadge color="#84cc16" count={stats.warning} />
            <StatBadge color="#fbbf24" count={stats.dying} />
            <StatBadge color="#f97316" count={stats.dormant} />
          </div>
          
          {needingAttention > 0 && (
            <div className="mt-2 bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 rounded-lg py-2 px-3 flex items-center gap-2">
              <span className="text-amber-600 dark:text-amber-400 text-xs font-bold">
                ⚠️ {needingAttention} relationships need water
              </span>
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}

function StatBadge({ color, count }: { color: string; count: number }) {
  return (
    <div className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-white/60 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/5">
      <div 
        className="w-2.5 h-2.5 rounded-full shadow-xs" 
        style={{ backgroundColor: color }}
      />
      <span className="text-xs font-black text-gray-700 dark:text-gray-300">{count}</span>
    </div>
  );
}
