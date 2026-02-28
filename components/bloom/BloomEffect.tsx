'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LeafIcon } from './LeafIcon';
import { playBloomChime } from '@/lib/bloom/sounds';
import { cn } from '@/lib/utils';

interface BloomEffectProps {
  isActive: boolean;
  onComplete?: () => void;
  className?: string;
}

export function BloomEffect({ isActive, onComplete, className }: BloomEffectProps) {
  const [shouldRender, setShouldRender] = useState(false);
  const [randomX, setRandomX] = useState(0);

  useEffect(() => {
    if (isActive) {
      const startTimer = setTimeout(() => {
        setRandomX(Math.random() > 0.5 ? 20 : -20);
        setShouldRender(true);
        playBloomChime();
      }, 0);
      
      // Auto-cleanup after animation completes
      const timer = setTimeout(() => {
        setShouldRender(false);
        onComplete?.();
      }, 1500); // 1.5s total duration matches our longest motion

      return () => {
        clearTimeout(startTimer);
        clearTimeout(timer);
      };
    }
  }, [isActive, onComplete]);

  return (
    <AnimatePresence>
      {shouldRender && (
        <div className={cn("absolute inset-0 pointer-events-none z-50 flex items-center justify-center overflow-visible", className)}>
          
          {/* 1. Pulse Ring */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0.8 }}
            animate={{ 
              scale: 2.5, 
              opacity: 0,
            }}
            transition={{ 
              duration: 0.8, 
              ease: "easeOut" 
            }}
            className="absolute inset-0 m-auto w-full h-full rounded-full border-4 border-emerald-400"
            style={{ 
              // Create a circular shape that matches the parent's general bounding box
              borderRadius: '50%' 
            }}
          />
          
          {/* 2. Floating Leaf */}
          <motion.div
            initial={{ 
              opacity: 0, 
              scale: 0.2, 
              y: 0, 
              x: 0,
              rotate: -20
            }}
            animate={{ 
              opacity: [0, 1, 1, 0],
              scale: [0.2, 1.2, 1, 0.8],
              y: -80, // Float up
              x: randomX, // Slight drift left or right
              rotate: 15
            }}
            transition={{ 
              duration: 1.2, 
              ease: "easeOut",
              times: [0, 0.2, 0.8, 1]
            }}
            className="absolute z-50 text-emerald-400 drop-shadow-md"
          >
            <LeafIcon className="w-8 h-8 filter drop-shadow-[0_0_8px_rgba(16,185,129,0.8)] fill-emerald-500 text-emerald-200" />
          </motion.div>

        </div>
      )}
    </AnimatePresence>
  );
}
