
'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import Leaf from './Leaf';
import { FilterType } from './CategoryFilters';

export interface Contact {
  id: string | number;
  initials: string;
  name: string;
  days: number;
  category: FilterType;
  lastContactDate?: string;
}

interface RelationshipGardenProps {
  contacts: Contact[];
  filter: FilterType;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  contact: Contact | null;
}

export default function RelationshipGarden({ contacts, filter }: RelationshipGardenProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    contact: null,
  });

  // Constants
  const CIRCLE_CONFIG = {
    1: { radius: 100, color: '#10b981' }, // Innermost (doubled from proto 50 for better spacing visually?) No, let's stick to proto but maybe scale if needed. Proto had canvas 600px height.
    // Proto: 50, 100, 160, 230.
    // Let's use responsive radius if possible, or fixed. Fixed is easier for now.
  };

  function getCircleAndColor(days: number) {
    if (days <= 7) {
      return { circle: 1, radius: 60, color: '#10b981', status: 'Healthy' }; // Increased radius slightly
    } else if (days <= 21) {
      return { circle: 2, radius: 120, color: '#84cc16', status: 'Good' };
    } else if (days <= 45) {
      return { circle: 3, radius: 190, color: '#fbbf24', status: 'Warning' };
    } else {
      return { circle: 4, radius: 270, color: '#f97316', status: 'Dying' };
    }
  }

  // Filter contacts
  const filteredContacts = useMemo(() => {
    return filter === 'all' 
      ? contacts 
      : contacts.filter(c => c.category === filter);
  }, [contacts, filter]);

  // Calculate positions
  const leaves = useMemo(() => {
    // Group by circle
    const circles: Record<number, Contact[]> = { 1: [], 2: [], 3: [], 4: [] };
    
    filteredContacts.forEach(contact => {
      const { circle } = getCircleAndColor(contact.days);
      circles[circle].push(contact);
    });

    const calculatedLeaves: Array<{
      contact: Contact;
      x: number;
      y: number;
      rotation: number;
      color: string;
      circle: number; // Debugging
    }> = [];

    // Center is relative to the container. Let's assume container is 600x600 or centered.
    // We'll use 50% 50% and absolute positioning.
    
    Object.entries(circles).forEach(([circleNumStr, circleContacts]) => {
      const circleNum = parseInt(circleNumStr);
      // Determine radius for this group based on days (representative)
      // Actually we need the radius from the config.
      // We can pick a representative day count to get the config, or just hardcode map.
      let radius = 0;
      let color = '';
      
      if (circleNum === 1) { radius = 60; color = '#10b981'; }
      else if (circleNum === 2) { radius = 120; color = '#84cc16'; }
      else if (circleNum === 3) { radius = 190; color = '#fbbf24'; }
      else { radius = 270; color = '#f97316'; }

      circleContacts.forEach((contact, i) => {
        // angle
        const angle = (i / circleContacts.length) * Math.PI * 2;
        
        // Math matches prototype
        // x = centerX + cos(angle) * radius 
        // y = centerY + sin(angle) * radius
        // But in CSS relative to center (0,0 is center), so just cos*r, sin*r
        
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        // Rotation
        // In prototype: atan2(y - centerY, x - centerX) * 180 / PI
        // Here y and x are already relative to center.
        // Also prototype adds offsets (-21, -24) for centering leaf.
        // We'll handle centering with transform translate in CSS or here.
        
        const rotation = (Math.atan2(y, x) * 180 / Math.PI) + 90; // +90 to orient correctly (leaf points out)

        calculatedLeaves.push({
          contact,
          x,
          y,
          rotation,
          color,
          circle: circleNum
        });
      });
    });

    return calculatedLeaves;
  }, [filteredContacts]);

  // Tooltip handlers
  const handleLeafEnter = (e: React.MouseEvent, contact: Contact) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setTooltip({
      visible: true,
      x: rect.left + window.scrollX,
      y: rect.top + window.scrollY - 10,
      contact
    });
  };

  const handleLeafMove = (e: React.MouseEvent) => {
     setTooltip(prev => ({
       ...prev,
       x: e.clientX, // Keep close to mouse
       y: e.clientY - 60
     }));
  };

  const handleLeafLeave = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  return (
    <div className="relative w-full h-[650px] bg-gradient-to-b from-white to-slate-50 rounded-xl overflow-hidden shadow-inner border border-slate-100" ref={containerRef}>
      
      {/* Guide Circles */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="absolute border border-dashed border-slate-200 rounded-full w-[120px] h-[120px]" />
        <div className="absolute border border-dashed border-slate-200 rounded-full w-[240px] h-[240px]" />
        <div className="absolute border border-dashed border-slate-200 rounded-full w-[380px] h-[380px]" />
        <div className="absolute border border-dashed border-slate-200 rounded-full w-[540px] h-[540px]" />
        
        <div className="absolute text-xs font-semibold text-slate-300 uppercase tracking-widest pointer-events-none select-none">
          Healthiest
        </div>
      </div>

      {/* Info Badge */}
      <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-sm border border-slate-200 p-4 rounded-xl shadow-sm text-right z-10">
        <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1">Showing</div>
        <div className="text-lg font-bold text-slate-800">
          {filter === 'all' ? 'All Contacts' : filter.charAt(0).toUpperCase() + filter.slice(1)}
        </div>
      </div>

      {/* Leaves Container (Centered) */}
      <div className="absolute top-1/2 left-1/2 w-0 h-0">
        {leaves.map((leaf, i) => (
          <div
            key={leaf.contact.id}
            className="absolute transition-all duration-700 ease-out"
            style={{
              transform: `translate(${leaf.x}px, ${leaf.y}px) translate(-50%, -50%) rotate(${leaf.rotation - 90}deg)`,
              // -90 adjustment because we added +90 earlier, need to verify
              // Actually prototype: rotation = atan2(dy, dx) ...
              // Leaf points UP by default? The path:
              // M 21 46 (bottom) ... 21 2 (top)
              // So leaf points UP.
              // Atan2(y, x) gives angle from X axis.
              // If point is at (r, 0) -> angle 0. Leaf should point Right.
              // So we need to rotate +90.
              // Let's verify visual:
              // top (0, -r) -> angle -90. Leaf should point Up. (-90 + 90 = 0). Correct.
              zIndex: 10 + leaf.circle, // Inner circles on top? Or outer? Usually doesn't matter much if spaced.
            }}
          >
            <Leaf 
              color={leaf.color} 
              initials={leaf.contact.initials}
              onMouseEnter={(e) => handleLeafEnter(e, leaf.contact)}
              onMouseMove={handleLeafMove}
              onMouseLeave={handleLeafLeave}
            />
          </div>
        ))}
      </div>

      {/* Tooltip Portal could be better, but fixed pos works */}
      {tooltip.visible && tooltip.contact && (
        <div 
          className="fixed z-[100] bg-slate-900/95 backdrop-blur text-white p-4 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.3)] min-w-[200px] pointer-events-none transition-opacity duration-200"
          style={{ 
            left: tooltip.x, 
            top: tooltip.y,
            transform: 'translate(16px, 0)' // Just offset a bit
          }}
        >
          <div className="font-semibold text-[15px] mb-2">{tooltip.contact.name}</div>
          <div className="flex justify-between text-xs opacity-90 mb-1">
            <span>Last contact:</span>
            <span className="font-bold">{tooltip.contact.days} days ago</span>
          </div>
          <div className="flex justify-between text-xs opacity-90 mb-2">
            <span>Status:</span>
            <span className="font-bold">{getCircleAndColor(tooltip.contact.days).status}</span>
          </div>
          <div className="inline-block px-2 py-1 bg-white/15 rounded text-[11px] capitalize">
            {tooltip.contact.category}
          </div>
        </div>
      )}

    </div>
  );
}
