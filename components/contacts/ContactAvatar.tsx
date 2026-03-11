'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Camera } from 'lucide-react';
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
  const [showInfo, setShowInfo] = useState(false);
  const pipRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

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
    setShowInfo((prev) => !prev);
  };

  useEffect(() => {
    if (!showInfo) return;
    const handleClickAway = (e: Event) => {
      const target = e.target as Node;
      if (
        pipRef.current &&
        !pipRef.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
      ) {
        setShowInfo(false);
      }
    };
    document.addEventListener('mousedown', handleClickAway);
    document.addEventListener('touchstart', handleClickAway);
    return () => {
      document.removeEventListener('mousedown', handleClickAway);
      document.removeEventListener('touchstart', handleClickAway);
    };
  }, [showInfo]);

  return (
    <div className={cn('relative group mb-6', className)}>
      {/* Main Avatar Area */}
      <div
        onClick={onAvatarClick}
        className={cn(
          'w-32 h-32 rounded-full bg-slate-900 flex items-center justify-center text-4xl font-black text-white border-4 transition-all duration-500 shadow-2xl group-hover:scale-105 cursor-pointer',
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

      {/* Health Score Pip - interactive, separate from avatar */}
      <button
        ref={pipRef}
        id="tour-health-score"
        type="button"
        onClick={handlePipClick}
        className={cn(
          'absolute bottom-0 right-0 w-10 h-10 rounded-full border-4 border-slate-950 shadow-md flex items-center justify-center text-white font-sans font-bold text-sm transition-transform hover:scale-110 active:scale-95 z-10',
          getHealthColor(healthScore)
        )}
      >
        {Math.round(healthScore)}
      </button>

      {/* Health Score Info Popover - above avatar */}
      {showInfo && (
        <div
          ref={popoverRef}
          onMouseLeave={() => setShowInfo(false)}
          className="absolute bottom-full right-0 mb-2 w-64 p-3 rounded-xl border border-slate-700 bg-slate-900 text-white z-50 shadow-2xl"
        >
          <h3 className="font-bold text-base text-white mb-2">
            Relationship Health: {Math.round(healthScore)}
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            This score shows how nurtured this connection is. It drifts lower over
            time if you don&apos;t stay in touch. Use the Brain Dump to boost it!
          </p>
        </div>
      )}
    </div>
  );
}
