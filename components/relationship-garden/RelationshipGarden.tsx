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
  target_frequency_days?: number | null;  // For leaf sizing
  importance?: 'high' | 'medium' | 'low';
  is_favorite?: boolean;  // For ring placement
}

interface RelationshipGardenProps {
  contacts: Contact[];
  // relationships prop removed as it was unused and typed as any
  filter: FilterType;
  onContactClick?: (contact: Contact) => void;
  onQuickLog?: (contact: Contact) => void;
  hoveredContactId?: string | null;
  desktopheaderControls?: React.ReactNode;
  hideControls?: boolean; // Hide zoom and search controls
  hideInfoBadge?: boolean; // Hide the "SHOWING" info badge
  initialZoom?: number; // Set initial zoom level (default 100)
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  contact: Contact | null;
}

// Get color based on days since contact and target frequency
function getColorForDays(days: number, targetFrequencyDays?: number | null): string {
  const targetDays = targetFrequencyDays || 30; // Default to monthly if not set
  
  // Blooming: Within target cadence
  if (days < targetDays) return '#10b981';   // Green - Blooming
  
  // Nourished: Within 50% grace period
  if (days < targetDays * 1.5) return '#84cc16';   // Lime - Nourished
  
  // Thirsty: Overdue but not severely
  if (days < targetDays * 2.5) return '#fbbf24';  // Yellow - Thirsty
  
  // Fading: Severely overdue
  return '#f97316';                   // Orange - Fading
}

// Get status label
function getStatusLabel(days: number, targetFrequencyDays?: number | null): string {
  const targetDays = targetFrequencyDays || 30;
  
  if (days < targetDays) return 'Blooming';
  if (days < targetDays * 1.5) return 'Nourished';
  if (days < targetDays * 2.5) return 'Thirsty';
  return 'Fading';
}

import { Search, X, Save, Sparkles } from 'lucide-react';

// ... existing imports ...

export default function RelationshipGarden({ contacts, filter, onContactClick, onQuickLog, hoveredContactId, desktopheaderControls, hideControls = false, hideInfoBadge = false, initialZoom = 100 }: RelationshipGardenProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    contact: null,
  });
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedContactId, setHighlightedContactId] = useState<string | null>(null);

  // Zoom state with localStorage persistence
  const [zoom, setZoom] = useState(() => {
    if (typeof window !== 'undefined' && !hideControls) {
      const saved = localStorage.getItem('gardenDefaultZoom');
      return saved ? parseInt(saved) : initialZoom;
    }
    return initialZoom;
  });
  const [defaultZoom, setDefaultZoom] = useState(() => {
    if (typeof window !== 'undefined' && !hideControls) {
      const saved = localStorage.getItem('gardenDefaultZoom');
      return saved ? parseInt(saved) : initialZoom;
    }
    return initialZoom;
  });
  const [saved, setSaved] = useState(false);
  
  // Pan state
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Search logic
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setHighlightedContactId(null);
      return;
    }
    
    const lowerQuery = query.toLowerCase();
    const match = contacts.find(c => c.name.toLowerCase().includes(lowerQuery));
    
    if (match) {
      setHighlightedContactId(match.id.toString());
    } else {
      setHighlightedContactId(null);
    }
  };

  const clearSearch = () => {
    handleSearch('');
  };

  // Zoom handlers
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 10, 120));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 10, 25));
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
        const newZoom = Math.min(Math.max(touchStartRef.current.zoom * ratio, 25), 150);
        setZoom(newZoom);
      } else if (e.touches.length === 1 && isDragging) {
          e.preventDefault(); // Prevent page scroll while dragging garden
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
      e.preventDefault(); // Always prevent default page scroll when over the garden
      e.stopPropagation();

      if (e.ctrlKey || e.metaKey) {
        // ZOOM
        const delta = e.deltaY;
        setZoom(prev => {
          const direction = delta > 0 ? -1 : 1; 
          const newZoom = prev + (direction * 5);
          return Math.min(Math.max(newZoom, 25), 150);
        });
      } else {
        // PAN
        // Standard mouse wheel sends deltaY for vertical.
        // Shift + wheel usually sends deltaX, but some browsers/mice might verify.
        // We will accumulate to panOffset.
        setPanOffset(prev => ({
          x: prev.x - e.deltaX, // Pan direction might need inversion depending on preference "natural scrolling"
          y: prev.y - e.deltaY
        }));
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

  // Calculate Ring-Based positions - FREQUENCY-BASED LAYOUT
  const leafPositions = useMemo(() => {
    // 1. Bucket contacts by contact frequency (target_frequency_days)
    const buckets = {
      highFrequency: [] as Contact[],    // Need to contact often (center)
      mediumFrequency: [] as Contact[],  // Moderate contact (middle)
      lowFrequency: [] as Contact[],     // Less frequent contact (outer)
    };

    filteredContacts.forEach(contact => {
      const targetFreq = contact.target_frequency_days || contact.targetFrequencyDays || 999;

      if (targetFreq <= 14) {
        // Weekly to biweekly contact needed - center ring
        buckets.highFrequency.push(contact);
      } else if (targetFreq <= 45) {
        // Monthly contact needed - middle ring
        buckets.mediumFrequency.push(contact);
      } else {
        // Quarterly or less - outer ring
        buckets.lowFrequency.push(contact);
      }
    });

    // 2. Helper to distribute points in a ring using Golden Angle
    const calculateRingPositions = (
      items: Contact[],
      minRadius: number,
      maxRadius: number,
      startAngleOffset: number
    ) => {
      // Deterministic pseudo-random jitter helper
      const getJitter = (id: string | number, seed: string = '') => {
        const str = (id.toString() + seed);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        // Map hash to range for random scatter
        return hash;
      };

      const count = items.length;

      // Sort by days so more recently contacted are towards inner edge
      // STABLE SORT FIX: Add ID as tie-breaker to prevent jitter
      const sortedItems = [...items].sort((a, b) => {
        const daysDiff = a.days - b.days;
        if (daysDiff !== 0) return daysDiff;
        return a.id.toString().localeCompare(b.id.toString());
      });

      return sortedItems.map((contact, i) => {
        // Calculate base radius within ring based on recency
        // More recently contacted (lower days) = inner edge
        // Less recently contacted (higher days) = outer edge
        const normalizedPosition = i / Math.max(1, count - 1); // 0 to 1
        const baseRadius = minRadius + (maxRadius - minRadius) * normalizedPosition;

        // Add deterministic random scatter within the ring - REDUCED JITTER to prevent overlap
        const jitterAmount = (maxRadius - minRadius) * 0.1; // Reduced from 0.3 to 0.1
        const jitter = (getJitter(contact.id, 'radius') % 1000) / 1000 - 0.5; // -0.5 to 0.5
        const radius = baseRadius + (jitter * jitterAmount);

        // Golden angle for even distribution
        const angle = i * GOLDEN_ANGLE + startAngleOffset + (getJitter(contact.id, 'angle') % 100) / 100 * 0.1;

        // Base coordinates
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        // Rotation: leaf points outward
        const rotation = (Math.atan2(y, x) * 180 / Math.PI);

        const color = getColorForDays(contact.days, contact.target_frequency_days || contact.targetFrequencyDays);

        // Scale based on relationship type (favorites/friends/contacts)
        // Favorites = biggest, Friends = medium, Contacts = smaller
        let scale = 1.0; // Default for contacts
        if (contact.is_favorite) {
          scale = 1.8; // Biggest for favorites
        } else if (contact.importance === 'high') {
          scale = 1.4; // Medium for friends
        } else if (contact.importance === 'medium') {
          scale = 1.0; // Normal for regular contacts
        } else {
          scale = 0.8; // Smaller for low importance
        }

        // Add random slight rotation jitter for natural look
        const rotJitter = (getJitter(contact.id, 'rot') % 30) - 15; // -15 to +15 degrees

        return { contact, x, y, rotation: rotation + rotJitter, color, scale };
      });
    };

    // 3. Define Rings (radii in pixels) for three frequency levels
    // Center: High frequency (contact often - weekly/biweekly)
    // Middle: Medium frequency (contact monthly)
    // Outer: Low frequency (contact quarterly or less)
    // ADJUSTED RADII to prevent overlap between rings and spread items out

    const p1 = calculateRingPositions(buckets.highFrequency, 80, 220, 0);     // Expanded inner ring
    const p2 = calculateRingPositions(buckets.mediumFrequency, 280, 500, p1.length * GOLDEN_ANGLE); // Gap of 60px
    const p3 = calculateRingPositions(buckets.lowFrequency, 560, 900, (p1.length + p2.length) * GOLDEN_ANGLE); // Gap of 60px

    return [...p1, ...p2, ...p3];

  }, [filteredContacts]);

  const handleLeafEnter = (e: React.MouseEvent, contact: Contact) => {
    console.log('Leaf Enter:', contact.name);
    // Clear any pending hide timeout
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }

    // Clamp position to ensure tooltip stays on screen
    const tooltipWidth = 200; // min-w-[200px]
    // const tooltipHeight = 150; // approximate height
    const xPos = Math.min(e.clientX + 15, window.innerWidth - tooltipWidth - 10);
    const yPos = Math.max(10, e.clientY - 70); // Ensure it doesn't go above viewport

    console.log('Setting tooltip position:', { x: xPos, y: yPos, contact: contact.name });

    setTooltip({
      visible: true,
      x: xPos,
      y: yPos,
      contact
    });
  };

  const handleLeafMove = (e: React.MouseEvent) => {
    console.log('Leaf Move');

    // Clamp position to ensure tooltip stays on screen
    const tooltipWidth = 200;
    // const tooltipHeight = 150; // Unused
    const xPos = Math.min(e.clientX + 15, window.innerWidth - tooltipWidth - 10);
    const yPos = Math.max(10, e.clientY - 70);

    setTooltip(prev => ({
      ...prev,
      x: xPos,
      y: yPos
    }));
  };

  const handleLeafLeave = () => {
    console.log('Leaf Leave');
    // Delay hiding to allow user to move mouse to tooltip
    hideTimeoutRef.current = setTimeout(() => {
      setTooltip(prev => ({ ...prev, visible: false }));
    }, 200); // 200ms delay
  };

  const handleTooltipEnter = () => {
    // Cancel hide when mouse enters tooltip
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  };

  const handleTooltipLeave = () => {
    // Hide tooltip when mouse leaves it
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  return (
    <div className="space-y-4">
      {/* Zoom Controls & Search Container */}
      {!hideControls && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            {/* Desktop-only view controls passed from parent */}
            {desktopheaderControls && (
              <div className="hidden md:flex items-center gap-2">
                {desktopheaderControls}
              </div>
            )}

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
                <button
                  onClick={handleSetDefaultZoom}
                  className={`w-8 h-8 md:w-7 md:h-7 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all active:scale-95 ml-1 ${saved ? 'text-green-500 dark:text-green-400 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20' : ''}`}
                  title="Set Default Zoom"
                >
                  {saved ? <Sparkles className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Search Bar - Positioned to the right of zoom on desktop */}
            <div className="relative w-full md:flex-1 md:max-w-[400px] mx-auto md:mx-0">
              <input
                type="text"
                placeholder="Search for a person..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
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
        </div>
      )}

      {/* Garden Canvas */}
      <div 
        className="relative w-full h-[85vh] md:h-[90vh] bg-linear-to-b from-white to-slate-50 dark:from-[#111827] dark:to-[#0f172a] rounded-xl overflow-hidden shadow-inner border border-slate-100 dark:border-gray-800" 
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >


        {/* Info Badge - Desktop Only */}
        {!hideInfoBadge && (
          <div className="hidden md:block absolute top-5 right-5 bg-white/10 dark:bg-slate-900/40 backdrop-blur-md border border-white/10 border-slate-200/50 dark:border-slate-700/50 p-5 rounded-4xl shadow-2xl shadow-black/20 text-right z-10 transition-all hover:scale-105 duration-300">
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mb-2 opacity-80">Showing</div>
            <div className="text-2xl font-black text-slate-800 dark:text-white tracking-tight drop-shadow-sm">
              {filter === 'all' ? 'All Contacts' : filter.charAt(0).toUpperCase() + filter.slice(1)}
            </div>
            <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 opacity-90">
              {filteredContacts.length} contacts
            </div>
          </div>
        )}

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
            {/* Center label */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-red-500/50 text-xs font-bold uppercase tracking-widest pointer-events-none select-none z-0 mt-8">
              High Priority
            </div>

            {/* Render Rings Guidelines - Three rings for contact frequency (Matching new max radii: 220, 500, 900) */}
            {/* Low Priority (Outer) - Green */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1800px] h-[1800px] rounded-full border border-green-500/20 bg-green-500/5 pointer-events-none">
               <div className="absolute top-[22%] left-1/2 -translate-x-1/2 text-green-500/50 text-xs font-bold uppercase tracking-widest">Low Priority</div>
            </div>
            
            {/* Medium Priority (Middle) - Amber */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] rounded-full border border-amber-500/20 bg-amber-500/5 pointer-events-none">
              <div className="absolute top-[18%] left-1/2 -translate-x-1/2 text-amber-500/50 text-xs font-bold uppercase tracking-widest">Medium Priority</div>
            </div>

            {/* High Priority (Inner) - Red */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[440px] h-[440px] rounded-full border border-red-500/20 bg-red-500/5 pointer-events-none" />
            


            {leafPositions.map(({ contact, x, y, rotation, color, scale }) => {
              const isHovered = hoveredContactId === contact.id.toString();
              const isHighlighted = highlightedContactId === contact.id.toString();
              
              // Apply highlight visuals
              const currentScale = isHighlighted ? 1.3 : (isHovered ? 1.1 : 1);
              const highlightFilter = isHighlighted 
                ? "drop-shadow(0 0 12px rgba(99, 102, 241, 0.8))" 
                : (isHovered ? `drop-shadow(0 0 15px ${color})` : 'none');

              // Calculate dimensions to center the leaf
              // Must match Leaf.tsx logic: w = max(44, 42*scale), h = max(44, 48*scale)
              // NOTE: We use the base 'scale' here, not 'currentScale', because FRAMER handles the scaling animation.
              // If we used currentScale, the centering would jump during animation.
              const leafW = Math.max(44, 42 * scale);
              const leafH = Math.max(44, 48 * scale);

              return (
              <motion.div
                key={contact.id}
                layout
                initial={false}
                animate={isHighlighted ? {
                  x: x - leafW / 2, 
                  y: y - leafH / 2, 
                  rotate: rotation,
                  scale: [currentScale, currentScale * 1.15, currentScale],
                  filter: [
                    "drop-shadow(0 0 12px rgba(99, 102, 241, 0.6))",
                    "drop-shadow(0 0 25px rgba(139, 92, 246, 1))", 
                    "drop-shadow(0 0 12px rgba(99, 102, 241, 0.6))"
                  ]
                } : {
                  x: x - leafW / 2, 
                  y: y - leafH / 2, 
                  rotate: rotation,
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
                  id={contact.id.toString()}
                  color={color} 
                  initials={contact.initials}
                  scale={isHighlighted ? scale * 1.5 : (isHovered ? scale * 1.3 : scale)} 
                  onMouseEnter={(e) => handleLeafEnter(e, contact)}
                  onMouseMove={handleLeafMove}
                  onMouseLeave={handleLeafLeave}
                  onClick={() => {
                    // Hide tooltip immediately on click to prevent overlap with modal
                    setTooltip(prev => ({ ...prev, visible: false }));
                    onContactClick?.(contact);
                  }}
                />
              </motion.div>
            )})}
          </div>
        </div>

        {/* Tooltip */}
        {tooltip.visible && tooltip.contact && (
          <div
            className="fixed z-[60] bg-slate-900/95 backdrop-blur-xl text-white p-4 rounded-xl shadow-2xl min-w-[200px] pointer-events-auto cursor-pointer"
            style={{
              left: tooltip.x,
              top: tooltip.y,
            }}
            onMouseEnter={handleTooltipEnter}
            onMouseLeave={handleTooltipLeave}
            onClick={() => {
              if (tooltip.contact) {
                setTooltip(prev => ({ ...prev, visible: false }));
                onContactClick?.(tooltip.contact);
              }
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
              {/* Quick Log Button - shown for ALL contacts */}
              {onQuickLog && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (tooltip.contact && onQuickLog) {
                      onQuickLog(tooltip.contact);
                      setTooltip(prev => ({ ...prev, visible: false }));
                      // Clear search/highlight to stop animation and reset view
                      setSearchQuery('');
                      setHighlightedContactId(null);
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

