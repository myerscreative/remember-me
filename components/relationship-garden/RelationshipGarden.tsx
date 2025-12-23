
'use client';

import React, { useState, useMemo, useRef } from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
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
  
  // Zoom state
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleReset = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  function getCircleAndColor(days: number) {
    if (days <= 7) {
      return { circle: 1, radius: 60, color: '#10b981', status: 'Healthy' };
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
      circle: number;
    }> = [];

    // Config for base radii of each health zone
    const baseRadii = {
      1: { start: 50, color: '#10b981' },   // Healthy core
      2: { start: 110, color: '#84cc16' },  // Good zone
      3: { start: 180, color: '#fbbf24' },  // Warning zone
      4: { start: 260, color: '#f97316' },  // Dying zone
    };
    
    // Max contacts per ring before creating new sub-ring
    const MAX_PER_RING = 8;
    // Spacing between sub-rings
    const RING_SPACING = 25;

    Object.entries(circles).forEach(([circleNumStr, circleContacts]) => {
      const circleNum = parseInt(circleNumStr) as 1 | 2 | 3 | 4;
      const { start: baseRadius, color } = baseRadii[circleNum];
      
      circleContacts.forEach((contact, i) => {
        // Determine which sub-ring this contact goes in
        const subRingIndex = Math.floor(i / MAX_PER_RING);
        // Position within the sub-ring
        const positionInSubRing = i % MAX_PER_RING;
        // How many contacts in this particular sub-ring
        const contactsInThisSubRing = Math.min(
          MAX_PER_RING, 
          circleContacts.length - (subRingIndex * MAX_PER_RING)
        );
        
        // Calculate radius for this sub-ring
        const radius = baseRadius + (subRingIndex * RING_SPACING);
        
        // Calculate angle - offset each sub-ring slightly for visual variety
        const angleOffset = (subRingIndex * Math.PI) / 8;
        const angle = (positionInSubRing / contactsInThisSubRing) * Math.PI * 2 + angleOffset;
        
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        const rotation = (Math.atan2(y, x) * 180 / Math.PI) + 90;

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
       x: e.clientX,
       y: e.clientY - 60
     }));
  };

  const handleLeafLeave = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  return (
    <div 
      className="relative w-full h-[650px] bg-gradient-to-b from-white to-slate-50 rounded-xl overflow-hidden shadow-inner border border-slate-100" 
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
    >
      
      {/* Zoom Controls */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        <button
          onClick={handleZoomIn}
          className="p-2 bg-white/90 hover:bg-white border border-slate-200 rounded-lg shadow-sm transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-5 h-5 text-slate-600" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 bg-white/90 hover:bg-white border border-slate-200 rounded-lg shadow-sm transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-5 h-5 text-slate-600" />
        </button>
        <button
          onClick={handleReset}
          className="p-2 bg-white/90 hover:bg-white border border-slate-200 rounded-lg shadow-sm transition-colors"
          title="Reset View"
        >
          <RotateCcw className="w-4 h-4 text-slate-600" />
        </button>
        <div className="text-center text-xs text-slate-500 font-medium mt-1">
          {Math.round(zoom * 100)}%
        </div>
      </div>

      {/* Zoomable/Pannable Container */}
      <div 
        className="absolute inset-0 transition-transform duration-200"
        style={{ 
          transform: `scale(${zoom}) translate(${panOffset.x / zoom}px, ${panOffset.y / zoom}px)`,
          transformOrigin: 'center center'
        }}
      >
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

        {/* Leaves Container (Centered) */}
        <div className="absolute top-1/2 left-1/2 w-0 h-0">
          {leaves.map((leaf) => (
            <div
              key={leaf.contact.id}
              className="absolute transition-all duration-700 ease-out"
              style={{
                transform: `translate(${leaf.x}px, ${leaf.y}px) translate(-50%, -50%) rotate(${leaf.rotation - 90}deg)`,
                zIndex: 10 + leaf.circle,
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
      </div>

      {/* Info Badge (outside zoom container) */}
      <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-sm border border-slate-200 p-4 rounded-xl shadow-sm text-right z-10">
        <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1">Showing</div>
        <div className="text-lg font-bold text-slate-800">
          {filter === 'all' ? 'All Contacts' : filter.charAt(0).toUpperCase() + filter.slice(1)}
        </div>
        <div className="text-xs text-slate-400 mt-1">
          {filteredContacts.length} contacts
        </div>
      </div>

      {/* Tooltip (fixed position, outside zoom) */}
      {tooltip.visible && tooltip.contact && (
        <div 
          className="fixed z-[100] bg-slate-900/95 backdrop-blur text-white p-4 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.3)] min-w-[200px] pointer-events-none transition-opacity duration-200"
          style={{ 
            left: tooltip.x, 
            top: tooltip.y,
            transform: 'translate(16px, 0)'
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
