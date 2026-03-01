"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';
import confetti from 'canvas-confetti';
import { getRandomAffirmation } from '@/lib/bloom/affirmations';

interface NurtureJubileeProps {
  isActive: boolean;
  contactName: string;
  onComplete?: () => void;
}

export function NurtureJubilee({ isActive, contactName, onComplete }: NurtureJubileeProps) {
  const [shouldRender, setShouldRender] = useState(false);
  
  // Use useMemo to avoid re-generating affirmation on setiap render, 
  // but we only want it to change when isActive becomes true.
  const [affirmation, setAffirmation] = useState('');

  useEffect(() => {
    if (isActive) {
      // Set affirmation only once when component becomes active
      setAffirmation(prev => prev || getRandomAffirmation());
      setShouldRender(true);

      // 1. Fire Confetti Cannons
      const fireConfetti = () => {
        const count = 150;
        const defaults = {
          origin: { y: 0.6 },
          spread: 70,
          ticks: 200,
          zIndex: 2000,
          colors: ['#6366f1', '#22c55e', '#eab308'] // Indigo, Vibrant Green, Gold
        };

        // Left Cannon
        confetti({
          ...defaults,
          particleCount: count,
          angle: 60,
          origin: { x: 0, y: 0.6 }
        });

        // Right Cannon
        confetti({
          ...defaults,
          particleCount: count,
          angle: 120,
          origin: { x: 1, y: 0.6 }
        });
      };

      // Small delay to ensure the overlay starts rendering first
      const confettiTimer = setTimeout(fireConfetti, 100);

      // 2. Auto-cleanup after animation completes
      const timer = setTimeout(() => {
        setShouldRender(false);
        onComplete?.();
      }, 3000); // 2.5s display + 0.5s fade out

      return () => {
        clearTimeout(confettiTimer);
        clearTimeout(timer);
      };
    }
  }, [isActive, onComplete]);

  return (
    <AnimatePresence>
      {shouldRender && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop Blur */}
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-md" />

          {/* Celebration Card */}
          <motion.div
            initial={{ scale: 0.8, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 1.1, opacity: 0 }}
            transition={{ 
              type: "spring", 
              damping: 15, 
              stiffness: 100,
              delay: 0.1 
            }}
            className="relative bg-[#0F172A]/95 border-2 border-slate-200/20 rounded-3xl shadow-[0_0_50px_rgba(34,197,94,0.15)] p-8 max-w-sm w-full text-center overflow-hidden"
          >
            {/* Pulsing Heart Icon */}
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                filter: [
                  "drop-shadow(0 0 10px rgba(34, 197, 94, 0.4))",
                  "drop-shadow(0 0 25px rgba(34, 197, 94, 0.8))",
                  "drop-shadow(0 0 10px rgba(34, 197, 94, 0.4))"
                ]
              }}
              transition={{ 
                duration: 1, 
                repeat: Infinity,
                ease: "easeInOut" 
              }}
              className="flex justify-center mb-6"
            >
              <Heart className="w-20 h-20 text-[#22c55e] fill-[#22c55e]" />
            </motion.div>

            {/* Headline */}
            <h2 className="text-3xl font-black text-white mb-2 tracking-tight">
              Connection Nurtured!
            </h2>

            {/* Contact Name with Graffiti Underline */}
            <div className="relative inline-block mb-6">
              <span className="text-xl font-bold text-slate-300 relative z-10 px-2 italic">
                {contactName}
              </span>
              <svg 
                className="absolute -bottom-2 left-0 w-full h-3 text-[#22c55e]/60" 
                viewBox="0 0 100 10" 
                preserveAspectRatio="none"
              >
                <motion.path
                  d="M2 8 C 20 2, 40 12, 60 5 C 80 2, 95 8, 98 6"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                />
              </svg>
            </div>

            {/* Sub-text (Affirmation) */}
            <p className="text-slate-400 text-lg leading-relaxed font-medium">
              &ldquo;{affirmation}&rdquo;
            </p>

            {/* Decorative background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-radial from-emerald-500/10 to-transparent pointer-events-none" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
