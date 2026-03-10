'use client';

import React from 'react';
import Image from 'next/image';
import { Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface ContactAvatarProps {
  contact: {
    id: string;
    name: string;
    first_name?: string;
    last_name?: string;
    photo_url?: string;
  };
  healthScore: number;
  onAvatarClick?: () => void;
  className?: string;
}

export function ContactAvatar({
  contact,
  healthScore,
  onAvatarClick,
  className,
}: ContactAvatarProps) {
  const name = `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || contact.name;
  const initials = name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const getHealthColor = (score: number) => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getHealthBorder = (score: number) => {
    if (score >= 70) return 'border-emerald-500';
    if (score >= 40) return 'border-orange-500';
    return 'border-red-500';
  };

  const handlePipClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  return (
    <div className={cn("relative group mb-6", className)}>
      {/* Main Avatar Area */}
      <div 
        onClick={onAvatarClick}
        className={cn(
          "w-32 h-32 rounded-full bg-slate-900 flex items-center justify-center text-4xl font-black text-white border-4 transition-all duration-500 shadow-2xl group-hover:scale-105 cursor-pointer",
          getHealthBorder(healthScore)
        )}
      >
        {contact.photo_url ? (
          <div className="relative w-full h-full rounded-full overflow-hidden">
            <Image 
              src={contact.photo_url} 
              alt={name} 
              fill 
              className="object-cover"
              sizes="128px"
            />
          </div>
        ) : (
          initials
        )}
        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Camera size={32} className="text-white drop-shadow-lg" />
        </div>
      </div>

      {/* Health Score Pip with Popover */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            id="tour-health-score"
            onClick={handlePipClick}
            className={cn(
              "absolute bottom-0 right-0 w-10 h-10 rounded-full border-4 border-slate-950 shadow-md flex items-center justify-center text-white font-sans font-bold text-sm transition-transform hover:scale-110 active:scale-95 z-10",
              getHealthColor(healthScore)
            )}
          >
            {Math.round(healthScore)}
          </button>
        </PopoverTrigger>
        
        <AnimatePresence>
          <PopoverContent 
            side="right" 
            align="end" 
            sideOffset={12}
            asChild
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, x: -10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: -10 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="bg-slate-900 border-slate-700 rounded-xl p-4 shadow-2xl text-sm max-w-[250px] text-slate-200 border z-50"
            >
              <div className="space-y-3">
                <h3 className="font-bold text-base text-white border-b border-slate-800 pb-2">
                  Relationship Health Score
                </h3>
                <p className="leading-relaxed text-slate-400">
                  This score (0–100) represents the current state of your connection with <span className="text-white font-semibold">{name}</span>. It is calculated based on the frequency of your interactions and the depth of the memories you&apos;ve shared.
                </p>
                
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    <span className="font-medium text-slate-300">70+: Nurtured</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                    <span className="font-medium text-slate-300">40–69: Drifting</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <span className="font-medium text-slate-300">&lt;40: Neglected</span>
                  </div>
                </div>
              </div>
              
              {/* Custom Arrow */}
              <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-slate-900 border-l border-b border-slate-700 rotate-45" />
            </motion.div>
          </PopoverContent>
        </AnimatePresence>
      </Popover>
    </div>
  );
}
