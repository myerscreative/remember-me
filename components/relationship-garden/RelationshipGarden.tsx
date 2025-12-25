'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import Seed, { getRelationshipLevel } from './Seed';
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
  targetFrequencyDays?: number;
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
  if (days <= 14) return '#10b981';   // Green - Blooming
  if (days <= 45) return '#84cc16';   // Lime - Nourished
  if (days <= 120) return '#fbbf24';  // Yellow - Thirsty
  return '#f97316';                   // Orange - Fading
}

// Get status label
function getStatusLabel(days: number): string {
  if (days <= 14) return 'Blooming';
  if (days <= 45) return 'Nourished';
  if (days <= 120) return 'Thirsty';
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
  const [zoom, setZoom] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gardenDefaultZoom');
      return saved ? parseInt(saved) : 100;
    }
    return 100;
  });
  const [defaultZoom, setDefaultZoom] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gardenDefaultZoom');
      return saved ? parseInt(saved) : 100;
    }
    return 100;
  });
  const [saved, setSaved] = useState(false);
  
  // Pan state
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Zoom handlers
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 10, 150));
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

  // Touch Zoom & Pan logic
  const touchStartRef = useRef<{ dist: number, zoom: number } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].pageX - e.touches[1].pageX,
          e.touches[0].pageY - e.touches[1].pageY
        );
        touchStartRef.current = { dist, zoom };
      } else if (e.touches.length === 1) {
          setIsDragging(true);
          setDragStart({ x: e.touches[0].clientX - panOffset.x, y: e.touches[0].clientY - panOffset.y });
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && touchStartRef.current) {
        e.preventDefault();
        const dist = Math.hypot(
          e.touches[0].pageX - e.touches[1].pageX,
          e.touches[0].pageY - e.touches[1].pageY
        );
        const ratio = dist / touchStartRef.current.dist;
        const newZoom = Math.min(Math.max(touchStartRef.current.zoom * ratio, 50), 150);
        setZoom(newZoom);
      } else if (e.touches.length === 1 && isDragging) {
          setPanOffset({
            x: e.touches[0].clientX - dragStart.x,
            y: e.touches[0].clientY - dragStart.y
          });
      }
    };

    const onTouchEnd = () => {
      touchStartRef.current = null;
      setIsDragging(false);
    };

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) {
        e.preventDefault();
        e.stopPropagation();
        const delta = e.deltaY;
        setZoom(prev => {
          const direction = delta > 0 ? -1 : 1; 
          const newZoom = prev + (direction * 5);
          return Math.min(Math.max(newZoom, 50), 150);
        });
      }
    };

    container.addEventListener('touchstart', onTouchStart, { passive: false });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onTouchEnd);
    container.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
      container.removeEventListener('wheel', onWheel);
    };
  }, [zoom, isDragging, dragStart, panOffset]);


  // Filter contacts
  const filteredContacts = useMemo(() => {
    return filter === 'all' 
      ? contacts 
      : contacts.filter(c => c.category === filter);
  }, [contacts, filter]);

  // Calculate seed size based on total contact count
  const seedSize = useMemo(() => {
    const count = filteredContacts.length;
    if (count > 200) return 4;
    if (count > 100) return 5;
    return 6;
  }, [filteredContacts.length]);

  // Calculate Ring-Based positions for seeds
  const seedPositions = useMemo(() => {
    // 1. Bucket contacts by health status
    const buckets = {
      healthy: [] as Contact[],
      good: [] as Contact[],
      warning: [] as Contact[],
      needsLove: [] as Contact[],
    };

    filteredContacts.forEach(contact => {
      const days = contact.days;
      if (days <= 14) buckets.healthy.push(contact);
      else if (days <= 45) buckets.good.push(contact);
      else if (days <= 120) buckets.warning.push(contact);
      else buckets.needsLove.push(contact);
    });

    // 2. Helper to distribute points in a ring using Golden Angle
    const calculateRingPositions = (
      items: Contact[], 
      minRadius: number, 
      maxRadius: number, 
      startAngleOffset: number
    ) => {
      const count = items.length;
      return items.map((contact, i) => {
        // Area-based spiral for even distribution across ring
        const areaInner = Math.PI * minRadius * minRadius;
        const areaOuter = Math.PI * maxRadius * maxRadius;
        const areaTarget = areaInner + (areaOuter - areaInner) * (i + 1) / (count + 1);
        const radius = Math.sqrt(areaTarget / Math.PI);
        
        const angle = i * GOLDEN_ANGLE + startAngleOffset;
        
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        const color = getColorForDays(contact.days);

        return { contact, x, y, color };
      });
    };

    // 3. Define Rings with tighter spacing for seeds
    const bloomingCount = buckets.healthy.length;
    const r1Max = bloomingCount < 10 ? 80 : 120;
    
    // Sort buckets by days
    buckets.healthy.sort((a,b) => a.days - b.days);
    buckets.good.sort((a,b) => a.days - b.days);
    buckets.warning.sort((a,b) => a.days - b.days);
    buckets.needsLove.sort((a,b) => a.days - b.days);

    // Tighter ring spacing for seeds (was 180, 300, 450, 700 for leaves)
    const p1 = calculateRingPositions(buckets.healthy, 30, r1Max, 0);
    const p2 = calculateRingPositions(buckets.good, r1Max + 10, 200, p1.length * GOLDEN_ANGLE);
    const p3 = calculateRingPositions(buckets.warning, 210, 350, (p1.length + p2.length) * GOLDEN_ANGLE);
    const p4 = calculateRingPositions(buckets.needsLove, 360, 550, (p1.length + p2.length + p3.length) * GOLDEN_ANGLE);

    return [...p1, ...p2, ...p3, ...p4];

  }, [filteredContacts]);

  // Tooltip handlers
  const handleSeedEnter = (e: React.MouseEvent, contact: Contact) => {
    setTooltip({
      visible: true,
      x: e.clientX + 15,
      y: e.clientY - 50,
      contact
    });
  };

  const handleSeedMove = (e: React.MouseEvent) => {
    setTooltip(prev => ({
      ...prev,
      x: e.clientX + 15,
      y: e.clientY - 50
    }));
  };

  const handleSeedLeave = () => {
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
          max="150"
          step="10"
          value={zoom}
          onChange={(e) => setZoom(parseInt(e.target.value))}
          className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full outline-none appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-slate-900 dark:[&::-webkit-slider-thumb]:bg-indigo-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb:hover]:bg-slate-700 dark:[&::-webkit-slider-thumb:hover]:bg-indigo-400 [&::-webkit-slider-thumb:hover]:scale-110"
        />
        
        <div className="text-sm font-semibold text-slate-900 dark:text-white min-w-[50px] text-right">
          {zoom}%
        </div>
        
        <button
          onClick={handleSetDefaultZoom}
          className={`px-3 h-9 border rounded-lg text-xs font-semibold transition-all active:scale-95 ${
            saved 
              ? 'bg-green-500 text-white border-green-500' 
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300'
          }`}
        >
          {saved ? '✓ Saved!' : 'Set Default'}
        </button>
      </div>

      {/* Garden Canvas - Deep Navy Background */}
      <div 
        className="relative w-full h-[90vh] bg-[#0B1120] rounded-xl overflow-hidden shadow-inner border border-slate-800" 
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        {/* Center label */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-600 text-sm font-semibold pointer-events-none select-none z-0">
          Most Recent
        </div>

        {/* Info Badge */}
        <div className="absolute top-5 right-5 bg-slate-900/90 backdrop-blur-sm border border-slate-700 p-4 rounded-xl shadow-sm text-right z-10">
          <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider mb-1">Showing</div>
          <div className="text-lg font-bold text-white">
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
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom / 100})`,
            transformOrigin: 'center',
          }}
        >
          {/* Seeds Container (Centered) */}
          <div className="absolute top-1/2 left-1/2 w-0 h-0">
            {/* Ring Guidelines */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[240px] h-[240px] rounded-full border border-green-500/10 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-lime-500/10 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border border-amber-500/10 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1100px] h-[1100px] rounded-full border border-orange-500/10 pointer-events-none" />
            
            {seedPositions.map(({ contact, x, y, color }) => {
              const isHovered = hoveredContactId === contact.id.toString();
              
              return (
              <motion.div
                key={contact.id}
                layout
                initial={false}
                animate={{
                  x,
                  y,
                  scale: isHovered ? 1.5 : 1,
                }}
                transition={{
                  type: "spring",
                  stiffness: 100,
                  damping: 20,
                  mass: 0.5
                }}
                className="absolute"
                style={{
                  marginLeft: -seedSize / 2,
                  marginTop: -seedSize / 2,
                  zIndex: isHovered ? 50 : 1,
                }}
              >
                <Seed 
                  color={color} 
                  size={seedSize}
                  isHighlighted={isHovered}
                  onMouseEnter={(e) => handleSeedEnter(e, contact)}
                  onMouseMove={handleSeedMove}
                  onMouseLeave={handleSeedLeave}
                  onClick={() => onContactClick?.(contact)}
                />
              </motion.div>
            )})}
          </div>
        </div>

        {/* Tooltip */}
        {tooltip.visible && tooltip.contact && (
          <div 
            className="fixed z-[1000] bg-slate-900/95 backdrop-blur-xl text-white p-4 rounded-xl shadow-2xl min-w-[200px] pointer-events-none"
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
            <div className="flex justify-between text-xs opacity-90 mb-1">
              <span>Status:</span>
              <span className="font-bold">{getStatusLabel(tooltip.contact.days)}</span>
            </div>
            <div className="flex justify-between text-xs opacity-90 mb-2">
              <span>Relationship Level:</span>
              <span className="font-bold text-indigo-300">{getRelationshipLevel(tooltip.contact.days)}</span>
            </div>
            
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
               <div className="inline-block px-2 py-1 bg-white/15 rounded text-[11px] capitalize">
                {tooltip.contact.category}
              </div>
              {/* Quick Log for High Importance */}
              {tooltip.contact.importance === 'high' && onQuickLog && (
                <button
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
