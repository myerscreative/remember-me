
'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import Leaf from './Leaf';
import { FilterType } from './CategoryFilters';

// GOLDEN ANGLE - Nature's perfect packing angle (137.5°)
const GOLDEN_ANGLE = 137.5 * (Math.PI / 180);

export interface Contact {
  id: string | number;
  initials: string;
  name: string;
  days: number;
  category: FilterType;
  lastContactDate?: string;
  targetFrequencyDays?: number;  // For cadence-based health
  importance?: 'high' | 'medium' | 'low';
}

interface RelationshipGardenProps {
  contacts: Contact[];
  filter: FilterType;
  onContactClick?: (contact: Contact) => void;
  onQuickLog?: (contact: Contact) => void;
  hoveredContactId?: string | null;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  contact: Contact | null;
}

// Get color based on days since contact
function getColorForDays(days: number): string {
  if (days <= 7) return '#10b981';   // Green - Healthy
  if (days <= 21) return '#84cc16';  // Lime - Good
  if (days <= 45) return '#fbbf24';  // Yellow - Warning
  return '#f97316';                   // Orange - Dying
}

// Get status label
function getStatusLabel(days: number): string {
  if (days <= 7) return 'Blooming';
  if (days <= 21) return 'Nourished';
  if (days <= 45) return 'Thirsty';
  return 'Fading';
}

export default function RelationshipGarden({ contacts, filter, onContactClick, onQuickLog, hoveredContactId }: RelationshipGardenProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    contact: null,
  });
  
  // Zoom state with localStorage persistence
  const [zoom, setZoom] = useState(100);
  const [defaultZoom, setDefaultZoom] = useState(100);
  const [saved, setSaved] = useState(false);
  
  // Pan state
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Load default zoom from localStorage
  useEffect(() => {
    const savedZoom = localStorage.getItem('gardenDefaultZoom');
    if (savedZoom) {
      const parsed = parseInt(savedZoom);
      setDefaultZoom(parsed);
      setZoom(parsed);
    }
  }, []);

  // Zoom handlers
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 10, 120));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 10, 50));
  const handleResetZoom = () => setZoom(defaultZoom);
  
  const handleSetDefaultZoom = () => {
    setDefaultZoom(zoom);
    localStorage.setItem('gardenDefaultZoom', zoom.toString());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, input')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Wheel Zoom Handler
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (e: WheelEvent) => {
      // Support Ctrl/Cmd/Alt + Scroll for zoom
      if (e.ctrlKey || e.metaKey || e.altKey) {
        e.preventDefault();
        e.stopPropagation();
        
        const delta = e.deltaY;
        setZoom(prev => {
          // Determine direction
          const direction = delta > 0 ? -1 : 1; 
          // Smaller steps for wheel (5%)
          const newZoom = prev + (direction * 5);
          return Math.min(Math.max(newZoom, 50), 120);
        });
      }
    };

    // Passive: false is required to use preventDefault
    container.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', onWheel);
    };
  }, []);


  // Filter contacts
  const filteredContacts = useMemo(() => {
    return filter === 'all' 
      ? contacts 
      : contacts.filter(c => c.category === filter);
  }, [contacts, filter]);

  // Calculate Ring-Based positions
  const leafPositions = useMemo(() => {
    // 1. Bucket contacts by health status
    const buckets = {
      healthy: [] as Contact[],
      good: [] as Contact[],
      warning: [] as Contact[],
      needsLove: [] as Contact[],
    };

    filteredContacts.forEach(contact => {
      const days = contact.days;
      if (days <= 7) buckets.healthy.push(contact);
      else if (days <= 21) buckets.good.push(contact);
      else if (days <= 45) buckets.warning.push(contact);
      else buckets.needsLove.push(contact);
    });

    // 2. Helper to distribute points in a ring using Golden Angle
    const calculateRingPositions = (
      items: Contact[], 
      minRadius: number, 
      maxRadius: number, 
      startAngleOffset: number
    ) => {
      // Deterministic pseudo-random jitter helper
      const getJitter = (id: string | number) => {
        const str = id.toString();
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        // Map hash to range [-5, 5]
        return (hash % 11) - 5;
      };

      const count = items.length;
      return items.map((contact, i) => {
        // Pure spiral logic `r = c * sqrt(i)` is best for area filling.
        // To fill a RING (annulus) from R_inner to R_outer:
        // Area_inner = pi * R_inner^2
        // Area_target = Area_inner + (Area_outer - Area_inner) * (i/N)
        // R_target = sqrt(Area_target / pi)
        
        const areaInner = Math.PI * minRadius * minRadius;
        const areaOuter = Math.PI * maxRadius * maxRadius;
        const areaTarget = areaInner + (areaOuter - areaInner) * (i + 1) / (count + 1); // +1 to avoid edge crowding
        const radius = Math.sqrt(areaTarget / Math.PI);
        
        const angle = i * GOLDEN_ANGLE + startAngleOffset;
        
        
        // Base coordinates
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        
        // Removed Position Jitter to restore Fibonacci pattern visibility
        // const jitterX = getJitter(contact.id + 'x');
        // const jitterY = getJitter(contact.id + 'y');
        // x += jitterX;
        // y += jitterY;

        // Rotation: leaf points outward
        const rotation = (Math.atan2(y, x) * 180 / Math.PI); 

        const color = getColorForDays(contact.days);
        
        // Scale based on importance
        let scale = 1.3; // Default medium
        if (contact.importance === 'high') scale = 1.8;
        else if (contact.importance === 'low') scale = 0.9;
        
        // Add random slight rotation jitter (+- 15deg) for more natural look
        // Uses same hash seed to be stable
        const rotJitter = getJitter(contact.id + 'r') * 2; 

        return { contact, x, y, rotation: rotation + rotJitter, color, scale };
      });
    };

    // 3. Define Rings (radii in pixels) with dynamic sizing
    // If Blooming ring is sparse (<10), pull it in tighter to 120px
    const bloomingCount = buckets.healthy.length;
    const r1Max = bloomingCount < 10 ? 120 : 180;
    
    // Sort buckets by days so inner-most in each ring are the "healthiest" of that ring
    buckets.healthy.sort((a,b) => a.days - b.days);
    buckets.good.sort((a,b) => a.days - b.days);
    buckets.warning.sort((a,b) => a.days - b.days);
    buckets.needsLove.sort((a,b) => a.days - b.days);

    const p1 = calculateRingPositions(buckets.healthy, 50, r1Max, 0);
    const p2 = calculateRingPositions(buckets.good, r1Max + 1, 300, p1.length * GOLDEN_ANGLE);
    const p3 = calculateRingPositions(buckets.warning, 301, 450, (p1.length + p2.length) * GOLDEN_ANGLE);
    const p4 = calculateRingPositions(buckets.needsLove, 451, 700, (p1.length + p2.length + p3.length) * GOLDEN_ANGLE);

    return [...p1, ...p2, ...p3, ...p4];

  }, [filteredContacts]);

  // Tooltip handlers
  const handleLeafEnter = (e: React.MouseEvent, contact: Contact) => {
    setTooltip({
      visible: true,
      x: e.clientX + 15,
      y: e.clientY - 50,
      contact
    });
  };

  const handleLeafMove = (e: React.MouseEvent) => {
    setTooltip(prev => ({
      ...prev,
      x: e.clientX + 15,
      y: e.clientY - 50
    }));
  };

  const handleLeafLeave = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  return (
    <div className="space-y-6">
      {/* Zoom Controls Bar */}
      <div className="flex items-center gap-4 px-5 py-4 bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-800 transition-colors">
        <div className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          🔍 Zoom
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleZoomOut}
            className="w-9 h-9 border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1e293b] rounded-lg flex items-center justify-center text-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-all active:scale-95"
          >
            −
          </button>
          <button
            onClick={handleResetZoom}
            className="w-9 h-9 border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1e293b] rounded-lg flex items-center justify-center text-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-all active:scale-95"
            title="Reset to default"
          >
            ⊙
          </button>
          <button
            onClick={handleZoomIn}
            className="w-9 h-9 border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1e293b] rounded-lg flex items-center justify-center text-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-all active:scale-95"
          >
            +
          </button>
        </div>
        
        <input
          type="range"
          min="50"
          max="120"
          step="10"
          value={zoom}
          onChange={(e) => setZoom(parseInt(e.target.value))}
          className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full outline-none appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-slate-900 dark:[&::-webkit-slider-thumb]:bg-indigo-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb:hover]:bg-slate-700 dark:[&::-webkit-slider-thumb:hover]:bg-indigo-400 [&::-webkit-slider-thumb:hover]:scale-110"
        />
        
        <div className="text-sm font-semibold text-slate-900 min-w-[50px] text-right">
          {zoom}%
        </div>
        
        <button
          onClick={handleSetDefaultZoom}
          className={`px-3 h-9 border rounded-lg text-xs font-semibold transition-all active:scale-95 ${
            saved 
              ? 'bg-green-500 text-white border-green-500' 
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
          }`}
        >
          {saved ? '✓ Saved!' : 'Set Default'}
        </button>
      </div>

      {/* Garden Canvas */}
      <div 
        className="relative w-full h-[90vh] bg-gradient-to-b from-white to-slate-50 dark:from-[#111827] dark:to-[#0f172a] rounded-xl overflow-hidden shadow-inner border border-slate-100 dark:border-gray-800" 
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        {/* Center label */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-700 text-sm font-semibold pointer-events-none select-none z-0">
          Most Recent
        </div>

        {/* Info Badge */}
        <div className="absolute top-5 right-5 bg-white/95 backdrop-blur-sm border border-slate-200 p-4 rounded-xl shadow-sm text-right z-10">
          <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider mb-1">Showing</div>
          <div className="text-lg font-bold text-slate-800">
            {filter === 'all' ? 'All Contacts' : filter.charAt(0).toUpperCase() + filter.slice(1)}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {filteredContacts.length} contacts
          </div>
        </div>

        {/* Pannable Container */}
        <div 
          className="absolute inset-0 transition-transform duration-75"
          style={{ 
            // Apply Zoom here on the container instead of recalculating positions
            // This is much more performant and correct for "Zooming into a canvas"
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom / 100})`,
            transformOrigin: 'center',
          }}
        >
          {/* Leaves Container (Centered) */}
          <div className="absolute top-1/2 left-1/2 w-0 h-0">
            {/* Render Rings Guidelines (Optional, helpful for debugging/visual structure) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full border border-green-500/10 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-lime-500/10 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full border border-amber-500/10 pointer-events-none" />
            
            {leafPositions.map(({ contact, x, y, rotation, color, scale }) => {
              const isHovered = hoveredContactId === contact.id.toString();
              
              return (
              <div
                key={contact.id}
                className="absolute transition-all duration-500 ease-out"
                  style={{
                    transform: `translate(${x}px, ${y}px) rotate(${rotation}deg)`,
                    zIndex: isHovered ? 50 : 1,
                    filter: isHovered ? `drop-shadow(0 0 15px ${color})` : 'none',
                    // Optimize: only apply transition to transform if needed, but 500ms is standard here
                  }}
                >
                  <Leaf 
                    color={color} 
                    initials={contact.initials}
                    scale={isHovered ? scale * 1.3 : scale} // Scale up by 30% on hover for clear feedback
                  onMouseEnter={(e) => {
                    handleLeafEnter(e, contact);
                    // Also trigger the parent hover state so sidebar updates if we ever bidirectionally link that way
                  }}
                  onMouseMove={handleLeafMove}
                  onMouseLeave={handleLeafLeave}
                  onClick={() => onContactClick?.(contact)}
                />
              </div>
            )})}
          </div>
        </div>

        {/* Tooltip */}
        {tooltip.visible && tooltip.contact && (
          <div 
            className="fixed z-[1000] bg-slate-900/95 backdrop-blur-xl text-white p-4 rounded-xl shadow-2xl min-w-[200px] pointer-events-auto"
            style={{ 
              left: tooltip.x, 
              top: tooltip.y,
            }}
          >
            <div className="font-semibold text-[15px] mb-2">{tooltip.contact.name}</div>
            <div className="flex justify-between text-xs opacity-90 mb-1">
              <span>Last contact:</span>
              <span className="font-bold">{tooltip.contact.days === 999 ? 'Never' : `${tooltip.contact.days} days ago`}</span>
            </div>
            <div className="flex justify-between text-xs opacity-90 mb-2">
              <span>Status:</span>
              <span className="font-bold">{getStatusLabel(tooltip.contact.days)}</span>
            </div>
            
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
               <div className="inline-block px-2 py-1 bg-white/15 rounded text-[11px] capitalize">
                {tooltip.contact.category}
              </div>
              {/* Quick Log for High Importance */}
              {tooltip.contact.importance === 'high' && onQuickLog && (
                <button
                  onClick={() => {
                    // Prevent click from passing to leaf click
                    // Use ref or just rely on parent handling if this was real DOM, but tooltip is pointer-events-none
                    // WAit, tooltip is pointer-events-none, so I can't click the button!
                    // I must enable pointer-events for the tooltip container.
                  }}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] uppercase font-bold px-2 py-1 rounded shadow-sm transition-colors pointer-events-auto"
                  onMouseDown={(e) => {
                     e.stopPropagation();
                     if (tooltip.contact && onQuickLog) onQuickLog(tooltip.contact);
                  }}
                >
                  ⚡ Quick Log
                </button>
              )}
            </div>
          </div>
        )}
      </div>


    </div>
  );
}

