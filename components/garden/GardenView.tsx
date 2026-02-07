'use client';

import { useState, useRef, useEffect } from 'react';
import { useGardenLayout, GardenContact, GardenMode } from '@/hooks/useGardenLayout';
import { GardenLeaf } from './GardenLeaf';
import { GardenToggle } from './GardenToggle';
import { GardenLegend } from './GardenLegend';
import { GardenGuideModal } from './GardenGuideModal';
import { motion, AnimatePresence } from 'framer-motion';
import { Info } from 'lucide-react';

interface GardenViewProps {
  contacts: GardenContact[];
  onLeafClick: (contact: GardenContact) => void;
}

export default function GardenView({ contacts, onLeafClick }: GardenViewProps) {
  const [mode, setMode] = useState<GardenMode>('frequency');
  const [showGuide, setShowGuide] = useState(false);
  const positionedContacts = useGardenLayout(contacts, mode);
  
  // Pan/Zoom State
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePosition, setLastMousePosition] = useState({ x: 0, y: 0 });

  // Load preference
  useEffect(() => {
      const savedMode = localStorage.getItem('garden_view_mode') as GardenMode;
      if (savedMode) setMode(savedMode);
  }, []);

  const handleModeChange = (newMode: GardenMode) => {
      setMode(newMode);
      localStorage.setItem('garden_view_mode', newMode);
  };

  const handleWheel = (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          const delta = -e.deltaY * 0.001;
          setScale(s => Math.min(Math.max(0.5, s + delta), 3));
      } else {
        // Pan
        setPosition(p => ({
            x: p.x - e.deltaX,
            y: p.y - e.deltaY
        }));
      }
  };
  
  const handleMouseDown = (e: React.MouseEvent) => {
     // Only drag if clicking background
     if (e.target === containerRef.current || e.target === containerRef.current?.firstChild) {
         setIsDragging(true);
         setLastMousePosition({ x: e.clientX, y: e.clientY });
     }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (isDragging) {
          const dx = e.clientX - lastMousePosition.x;
          const dy = e.clientY - lastMousePosition.y;
          setPosition(p => ({ x: p.x + dx, y: p.y + dy }));
          setLastMousePosition({ x: e.clientX, y: e.clientY });
      }
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div className="relative w-full h-[500px] md:h-[650px] overflow-hidden bg-linear-to-br from-[#f8fafc] to-[#f1f5f9] dark:from-slate-900 dark:to-[#0f172a] select-none rounded-3xl border border-slate-200 dark:border-slate-800 shadow-inner">
        {/* Header Controls */}
        <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
            <button
              onClick={() => setShowGuide(true)}
              className="p-2.5 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all hover:scale-105 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              title="Garden Guide"
            >
              <Info className="w-5 h-5" />
            </button>
            <GardenToggle mode={mode} onChange={handleModeChange} />
        </div>

        {/* Legend */}
        <GardenLegend mode={mode} />

        {/* Interactive Canvas */}
        <div 
            ref={containerRef}
            className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            <motion.div
                className="relative"
                style={{ 
                    x: position.x, 
                    y: position.y,
                    scale: scale 
                }}
                initial={{ scale: 0.8 }} // Zoom out slightly by default
                animate={{ scale: scale }}
            >
                {/* Rings Background */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div 
                           key={i} 
                           className="absolute rounded-full border border-slate-300/30 dark:border-slate-700/30 -translate-x-1/2 -translate-y-1/2"
                           style={{ 
                               width: (80 + (i-1)*60) * 2, 
                               height: (80 + (i-1)*60) * 2 
                           }}
                        />
                    ))}
                </div>

                {/* Leaves */}
                <AnimatePresence>
                    {positionedContacts.map(contact => (
                        <GardenLeaf 
                            key={contact.id} 
                            contact={contact} 
                            onClick={onLeafClick} 
                        />
                    ))}
                </AnimatePresence>
            </motion.div>
        </div>
        
        {/* Empty State */}
        {contacts.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center opacity-50">
                    <p className="text-2xl mb-2">🌱</p>
                    <p className="text-sm font-medium text-slate-500">Plant your first seed</p>
                </div>
            </div>
        )}
        
        {/* Garden Guide Modal */}
        <GardenGuideModal isOpen={showGuide} onClose={() => setShowGuide(false)} />
    </div>
  );
}
