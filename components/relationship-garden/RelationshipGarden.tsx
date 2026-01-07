'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
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

import { ArrowLeft, Loader2, List, LayoutGrid, Share2, Sparkles, Search, X } from 'lucide-react';

// ... existing imports ...

export default function RelationshipGarden({ contacts, filter, onContactClick, onQuickLog, hoveredContactId }: RelationshipGardenProps) {
  // ... existing refs and state ...
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedContactId, setHighlightedContactId] = useState<string | null>(null);

  // Search logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setHighlightedContactId(null);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const match = contacts.find(c => c.name.toLowerCase().includes(query));
    
    if (match) {
      setHighlightedContactId(match.id.toString());
    } else {
      setHighlightedContactId(null);
    }
  }, [searchQuery, contacts]);

  const clearSearch = () => {
    setSearchQuery('');
    setHighlightedContactId(null);
  };
  
  // ... existing zoom/pan logic ...

  return (
    <div className="space-y-4">
      {/* Zoom Controls & Search Container */}
      <div className="flex flex-col gap-3">
         {/* Compact Zoom Controls */}
        <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-800 transition-colors w-fit mx-auto md:mx-0 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 min-w-[60px]">
            <span>Zoom</span>
             <span className="text-slate-900 dark:text-white ml-auto">{Math.round(zoom)}%</span>
          </div>
          
          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

          <div className="flex items-center gap-1">
            <button
              onClick={handleZoomOut}
              className="w-8 h-8 md:w-7 md:h-7 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center text-lg leading-none text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all active:scale-95"
            >
              −
            </button>
            <input
              type="range"
              min="25"
              max="120"
              step="5"
              value={zoom}
              onChange={(e) => setZoom(parseInt(e.target.value))}
              className="w-24 md:w-32 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full outline-none appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-slate-900 dark:[&::-webkit-slider-thumb]:bg-indigo-500"
            />
            <button
              onClick={handleZoomIn}
              className="w-8 h-8 md:w-7 md:h-7 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center text-lg leading-none text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all active:scale-95"
            >
              +
            </button>
            <button
              onClick={handleResetZoom}
              className="w-8 h-8 md:w-7 md:h-7 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all active:scale-95 ml-1"
              title="Reset"
            >
              ⊙
            </button>
          </div>
        </div>

        {/* Search Bar - Positioned below zoom */}
        <div className="relative w-full max-w-[500px] mx-auto md:mx-0">
          <input
            type="text"
            placeholder="Search for a person..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/95 dark:bg-[#1e293b]/95 border-2 border-indigo-500/20 dark:border-indigo-500/30 rounded-xl py-2.5 pl-10 pr-10 text-sm md:text-[15px] text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          {searchQuery && (
            <button 
              onClick={clearSearch} 
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Garden Canvas */}
      <div 
        className="relative w-full h-[85vh] md:h-[90vh] bg-gradient-to-b from-white to-slate-50 dark:from-[#111827] dark:to-[#0f172a] rounded-xl overflow-hidden shadow-inner border border-slate-100 dark:border-gray-800" 
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

        {/* Info Badge - Desktop Only */}
        <div className="hidden md:block absolute top-5 right-5 bg-white/95 backdrop-blur-sm border border-slate-200 p-4 rounded-xl shadow-sm text-right z-10">
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
              const isHighlighted = highlightedContactId === contact.id.toString();
              
              // Apply highlight visuals
              const currentScale = isHighlighted ? 1.3 : (isHovered ? 1.1 : 1);
              const highlightFilter = isHighlighted 
                ? "drop-shadow(0 0 12px rgba(99, 102, 241, 0.8))" 
                : (isHovered ? `drop-shadow(0 0 15px ${color})` : 'none');

              return (
              <motion.div
                key={contact.id}
                layout
                initial={false}
                animate={isHighlighted ? {
                  x, y, rotate: rotation,
                  scale: [currentScale, currentScale * 1.15, currentScale],
                  filter: [
                    "drop-shadow(0 0 12px rgba(99, 102, 241, 0.6))",
                    "drop-shadow(0 0 25px rgba(139, 92, 246, 1))", 
                    "drop-shadow(0 0 12px rgba(99, 102, 241, 0.6))"
                  ]
                } : {
                  x, y, rotate: rotation,
                  scale: currentScale,
                  filter: highlightFilter
                }}
                transition={isHighlighted ? {
                  layout: { type: "spring", stiffness: 70, damping: 20 },
                  default: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                } : {
                  type: "spring",
                  stiffness: 70,
                  damping: 20,
                  mass: 1
                }}
                className="absolute"
                style={{
                  zIndex: isHighlighted || isHovered ? 50 : 1,
                }}
              >
                <Leaf 
                  color={color} 
                  initials={contact.initials}
                  scale={isHighlighted ? scale * 1.5 : (isHovered ? scale * 1.3 : scale)} 
                  onMouseEnter={(e) => handleLeafEnter(e, contact)}
                  onMouseMove={handleLeafMove}
                  onMouseLeave={handleLeafLeave}
                  onClick={() => onContactClick?.(contact)}
                />
              </motion.div>
            )})}
          </div>
        </div>

        {/* Tooltip */}
        {tooltip.visible && tooltip.contact && (
          <div 
            className="fixed z-1000 bg-slate-900/95 backdrop-blur-xl text-white p-4 rounded-xl shadow-2xl min-w-[200px] pointer-events-auto cursor-default"
            style={{ 
              left: tooltip.x, 
              top: tooltip.y,
            }}
            onMouseEnter={handleTooltipEnter}
            onMouseLeave={handleTooltipLeave}
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
              {/* Quick Log Button - shown for ALL contacts */}
              {onQuickLog && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (tooltip.contact && onQuickLog) {
                      onQuickLog(tooltip.contact);
                      setTooltip(prev => ({ ...prev, visible: false }));
                    }
                  }}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] uppercase font-bold px-2 py-1 rounded shadow-sm transition-colors"
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

