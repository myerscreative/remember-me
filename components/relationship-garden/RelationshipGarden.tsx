
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

// Zone configuration - matches HTML prototype
function getZoneConfig(days: number) {
  if (days <= 7) {
    return { 
      zone: 1, 
      baseRadius: 70,
      color: '#10b981',
      label: 'Healthy',
      layerSpacing: 25
    };
  } else if (days <= 21) {
    return { 
      zone: 2, 
      baseRadius: 140,
      color: '#84cc16',
      label: 'Good',
      layerSpacing: 30
    };
  } else if (days <= 45) {
    return { 
      zone: 3, 
      baseRadius: 220,
      color: '#fbbf24',
      label: 'Warning',
      layerSpacing: 35
    };
  } else {
    return { 
      zone: 4, 
      baseRadius: 310,
      color: '#f97316',
      label: 'Dying',
      layerSpacing: 40
    };
  }
}

// Smart multi-layer system - from HTML prototype
function getLayersForZone(count: number): number {
  if (count <= 15) return 1;      // Single layer is fine
  if (count <= 30) return 2;      // Split into 2 layers
  return 3;                        // Split into 3 layers
}

// Seeded random for consistent positions on re-render
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export default function RelationshipGarden({ contacts, filter }: RelationshipGardenProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    contact: null,
  });
  
  // Zoom and pan state
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

  // Pan handlers - work at any zoom level
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
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

  // Filter contacts
  const filteredContacts = useMemo(() => {
    return filter === 'all' 
      ? contacts 
      : contacts.filter(c => c.category === filter);
  }, [contacts, filter]);

  // Calculate positions with ORGANIC randomness algorithm from HTML prototype
  const leaves = useMemo(() => {
    // Group by zone
    const zones: Record<number, Contact[]> = { 1: [], 2: [], 3: [], 4: [] };
    
    filteredContacts.forEach(contact => {
      const { zone } = getZoneConfig(contact.days);
      zones[zone].push(contact);
    });

    const calculatedLeaves: Array<{
      contact: Contact;
      x: number;
      y: number;
      rotation: number;
      color: string;
      zone: number;
    }> = [];

    // Render each zone with dynamic layers
    Object.entries(zones).forEach(([zoneNumStr, zoneContacts]) => {
      if (zoneContacts.length === 0) return;
      
      const zoneNum = parseInt(zoneNumStr);
      const config = getZoneConfig(
        zoneNum === 1 ? 5 : zoneNum === 2 ? 15 : zoneNum === 3 ? 30 : 50
      );
      
      // Determine how many layers needed
      const numLayers = getLayersForZone(zoneContacts.length);
      
      // Split contacts across layers
      const contactsPerLayer = Math.ceil(zoneContacts.length / numLayers);
      
      for (let layer = 0; layer < numLayers; layer++) {
        const layerContacts = zoneContacts.slice(
          layer * contactsPerLayer, 
          (layer + 1) * contactsPerLayer
        );
        
        // Calculate radius for this sub-layer
        let radius: number;
        if (numLayers === 1) {
          radius = config.baseRadius;
        } else if (numLayers === 2) {
          // Two layers: slightly inside and outside base
          radius = config.baseRadius + (layer === 0 ? -12 : 12);
        } else {
          // Three layers: inside, base, outside
          radius = config.baseRadius + ((layer - 1) * config.layerSpacing);
        }
        
        // Position leaves on this sub-layer with ORGANIC randomness
        layerContacts.forEach((contact, i) => {
          // Use contact id as seed for consistent random positions
          const seed = typeof contact.id === 'string' 
            ? contact.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0)
            : contact.id;
          
          // Base angle with spacing
          const baseAngle = (i / layerContacts.length) * Math.PI * 2;
          
          // Add random angle offset to break spoke pattern (±20 degrees = π/9 radians)
          const angleJitter = (seededRandom(seed * 1) - 0.5) * (Math.PI / 9);
          const angle = baseAngle + angleJitter;
          
          // Add random radius variation for organic scatter (±15px)
          const radiusJitter = (seededRandom(seed * 2) - 0.5) * 30;
          const finalRadius = radius + radiusJitter;
          
          const x = Math.cos(angle) * finalRadius;
          const y = Math.sin(angle) * finalRadius;
          
          // Add random rotation offset (not perfectly radial) ±15 degrees
          const baseRotation = (Math.atan2(y, x) * 180 / Math.PI) + 90;
          const rotationJitter = (seededRandom(seed * 3) - 0.5) * 30;
          const rotation = baseRotation + rotationJitter;
          
          calculatedLeaves.push({
            contact,
            x,
            y,
            rotation,
            color: config.color,
            zone: zoneNum
          });
        });
      }
    });

    return calculatedLeaves;
  }, [filteredContacts]);

  // Generate guide circles for all layers
  const guideCircles = useMemo(() => {
    const circles: Array<{ radius: number; primary: boolean }> = [];
    
    // Group contacts by zone to determine layers
    const zones: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
    filteredContacts.forEach(contact => {
      const { zone } = getZoneConfig(contact.days);
      zones[zone]++;
    });

    // For each zone, add guide circles based on layer count
    [1, 2, 3, 4].forEach(zoneNum => {
      const count = zones[zoneNum];
      if (count === 0) return;
      
      const config = getZoneConfig(
        zoneNum === 1 ? 5 : zoneNum === 2 ? 15 : zoneNum === 3 ? 30 : 50
      );
      const numLayers = getLayersForZone(count);
      
      for (let layer = 0; layer < numLayers; layer++) {
        let radius: number;
        if (numLayers === 1) {
          radius = config.baseRadius;
        } else if (numLayers === 2) {
          radius = config.baseRadius + (layer === 0 ? -12 : 12);
        } else {
          radius = config.baseRadius + ((layer - 1) * config.layerSpacing);
        }
        circles.push({ 
          radius, 
          primary: layer === Math.floor(numLayers / 2) 
        });
      }
    });

    return circles;
  }, [filteredContacts]);

  // Tooltip handlers
  const handleLeafEnter = (e: React.MouseEvent, contact: Contact) => {
    setTooltip({
      visible: true,
      x: e.clientX,
      y: e.clientY - 60,
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
      className="relative w-full h-[700px] bg-gradient-to-b from-white to-slate-50 rounded-xl overflow-hidden shadow-inner border border-slate-100" 
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
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
          {guideCircles.map((circle, i) => (
            <div 
              key={i}
              className={`absolute border border-dashed rounded-full ${
                circle.primary ? 'border-slate-300/40' : 'border-slate-200/20'
              }`}
              style={{ 
                width: circle.radius * 2, 
                height: circle.radius * 2 
              }}
            />
          ))}
          
          <div className="absolute text-xs font-semibold text-slate-300 uppercase tracking-widest pointer-events-none select-none">
            Healthiest
          </div>
        </div>

        {/* Leaves Container (Centered) */}
        <div className="absolute top-1/2 left-1/2 w-0 h-0">
          {leaves.map((leaf) => (
            <div
              key={leaf.contact.id}
              className="absolute transition-all duration-500 ease-out"
              style={{
                transform: `translate(${leaf.x - 20}px, ${leaf.y - 23}px) rotate(${leaf.rotation}deg)`,
                zIndex: 10 + leaf.zone,
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
      <div className="absolute top-5 right-5 bg-white/95 backdrop-blur-sm border border-slate-200 p-4 rounded-xl shadow-sm text-right z-10">
        <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider mb-1">Showing</div>
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
            left: tooltip.x + 15, 
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
            <span className="font-bold">{getZoneConfig(tooltip.contact.days).label}</span>
          </div>
          <div className="inline-block px-2 py-1 bg-white/15 rounded text-[11px] capitalize">
            {tooltip.contact.category}
          </div>
        </div>
      )}

    </div>
  );
}
