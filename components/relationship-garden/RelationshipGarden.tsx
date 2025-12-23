
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

// Get color based on days since contact
function getColorForDays(days: number): string {
  if (days <= 7) return '#10b981';   // Green - Healthy
  if (days <= 21) return '#84cc16';  // Lime - Good
  if (days <= 45) return '#fbbf24';  // Yellow - Warning
  return '#f97316';                   // Orange - Dying
}

// Get status label
function getStatusLabel(days: number): string {
  if (days <= 7) return 'Healthy';
  if (days <= 21) return 'Good';
  if (days <= 45) return 'Warning';
  return 'Needs Love';
}

export default function RelationshipGarden({ contacts, filter }: RelationshipGardenProps) {
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
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 50, 1200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 50, 50));
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

  // Filter contacts
  const filteredContacts = useMemo(() => {
    return filter === 'all' 
      ? contacts 
      : contacts.filter(c => c.category === filter);
  }, [contacts, filter]);

  // Calculate Fibonacci spiral positions
  const leafPositions = useMemo(() => {
    // Sort by days - healthiest (lowest days) in center
    const sorted = [...filteredContacts].sort((a, b) => a.days - b.days);
    
    return sorted.map((contact, index) => {
      // Golden angle spiral - each leaf rotates 137.5° from previous
      const angle = index * GOLDEN_ANGLE;
      
      // Radius grows with square root for even density
      // Base scale factor adjusted by zoom
      const baseScaleFactor = 4;
      const zoomMultiplier = zoom / 100;
      const scaleFactor = baseScaleFactor * zoomMultiplier;
      const radius = scaleFactor * Math.sqrt(index);
      
      // Calculate position from center
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      // Rotation - leaf points outward from center
      const rotation = (Math.atan2(y, x) * 180 / Math.PI) + 90;
      
      // Color based on days
      const color = getColorForDays(contact.days);
      
      return { contact, x, y, rotation, color };
    });
  }, [filteredContacts, zoom]);

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
      <div className="flex items-center gap-4 px-5 py-4 bg-white rounded-xl border border-slate-200">
        <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          🔍 Zoom
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleZoomOut}
            className="w-9 h-9 border border-slate-200 bg-white rounded-lg flex items-center justify-center text-lg text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95"
          >
            −
          </button>
          <button
            onClick={handleResetZoom}
            className="w-9 h-9 border border-slate-200 bg-white rounded-lg flex items-center justify-center text-lg text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95"
            title="Reset to default"
          >
            ⊙
          </button>
          <button
            onClick={handleZoomIn}
            className="w-9 h-9 border border-slate-200 bg-white rounded-lg flex items-center justify-center text-lg text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95"
          >
            +
          </button>
        </div>
        
        <input
          type="range"
          min="50"
          max="1200"
          step="25"
          value={zoom}
          onChange={(e) => setZoom(parseInt(e.target.value))}
          className="flex-1 h-1.5 bg-slate-200 rounded-full outline-none appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-slate-900 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb:hover]:bg-slate-700 [&::-webkit-slider-thumb:hover]:scale-110"
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
        className="relative w-full h-[700px] bg-gradient-to-b from-white to-slate-50 rounded-xl overflow-hidden shadow-inner border border-slate-100" 
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        {/* Center label */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-300 text-sm font-semibold pointer-events-none select-none z-0">
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
          className="absolute inset-0"
          style={{ 
            transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
          }}
        >
          {/* Leaves Container (Centered) */}
          <div className="absolute top-1/2 left-1/2 w-0 h-0">
            {leafPositions.map(({ contact, x, y, rotation, color }) => (
              <div
                key={contact.id}
                className="absolute transition-all duration-500 ease-out"
                style={{
                  transform: `translate(${x - 20}px, ${y - 23}px) rotate(${rotation}deg)`,
                  zIndex: 1,
                }}
              >
                <Leaf 
                  color={color} 
                  initials={contact.initials}
                  onMouseEnter={(e) => handleLeafEnter(e, contact)}
                  onMouseMove={handleLeafMove}
                  onMouseLeave={handleLeafLeave}
                />
              </div>
            ))}
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
            <div className="flex justify-between text-xs opacity-90 mb-2">
              <span>Status:</span>
              <span className="font-bold">{getStatusLabel(tooltip.contact.days)}</span>
            </div>
            <div className="inline-block px-2 py-1 bg-white/15 rounded text-[11px] capitalize">
              {tooltip.contact.category}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
