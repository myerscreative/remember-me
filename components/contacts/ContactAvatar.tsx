'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Camera, Info } from 'lucide-react';
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

  return (
    <div className={cn('flex flex-col items-center mb-6', className)}>
      {/* Avatar - explicit size so absolute score pip is always within bounds */}
      <div className="relative w-32 h-32 group">
        <div
          onClick={onAvatarClick}
          className={cn(
            'w-32 h-32 rounded-full bg-slate-900 flex items-center justify-center text-4xl font-black text-white border-4 transition-all duration-500 shadow-2xl hover:scale-105 cursor-pointer',
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

        {/* Score pip - stays within the explicit 128×128 container */}
        <div
          id="tour-health-score"
          className={cn(
            'absolute bottom-0 right-0 w-10 h-10 rounded-full border-4 border-slate-950 shadow-md flex items-center justify-center text-white font-sans font-bold text-sm',
            getHealthColor(healthScore)
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {Math.round(healthScore)}
        </div>
      </div>

      {/* Health Score label row — normal flow, always visible, never clipped */}
      <div
        className="flex items-center gap-2 mt-2"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
          Health Score
        </span>
        <Link
          href="/field-guide#health-score"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-700 hover:bg-indigo-500 border border-slate-600 text-slate-400 hover:text-white transition-colors"
          aria-label="Learn about Health Score"
        >
          <Info className="w-3 h-3" strokeWidth={2.5} />
        </Link>
      </div>
    </div>
  );
}
