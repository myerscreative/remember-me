'use client';

import React from 'react';
import Image from 'next/image';

import { Camera, Info } from 'lucide-react';
import { HealthScoreModal } from './HealthScoreModal';
import { cn } from '@/lib/utils';
import { type HealthStatus } from '@/lib/relationship-health';

interface ContactAvatarProps {
  contact: {
    id: string;
    name: string;
    first_name?: string;
    last_name?: string;
    photo_url?: string;
  };
  daysRemaining: number;
  cadenceDays: number;
  targetContactDate: Date;
  onAvatarClick?: () => void;
  className?: string;
}

export function ContactAvatar({
  contact,
  daysRemaining,
  cadenceDays,
  targetContactDate,
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

  const status: HealthStatus = daysRemaining <= 0 ? 'neglected' : daysRemaining <= 5 ? 'drifting' : 'nurtured';
  const getHealthColor = () => {
    if (status === 'nurtured') return 'bg-green-500';
    if (status === 'drifting') return 'bg-amber-500';
    return 'bg-red-500';
  };
  const getHealthBorder = () => {
    if (status === 'nurtured') return 'border-emerald-500';
    if (status === 'drifting') return 'border-amber-500';
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
            getHealthBorder()
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

        {/* Days remaining pip */}
        <div
          id="tour-health-score"
          className={cn(
            'absolute bottom-0 right-0 w-10 h-10 rounded-full border-4 border-slate-950 shadow-md flex items-center justify-center text-white font-sans font-bold text-sm',
            getHealthColor()
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {Math.max(0, Math.round(daysRemaining))}
        </div>
      </div>

      {/* Days left label row */}
      <div
        className="flex items-center gap-2 mt-2"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
          Days left
        </span>
        <HealthScoreModal 
          daysRemaining={daysRemaining}
          cadenceDays={cadenceDays}
          trigger={
            <button
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-700 hover:bg-indigo-500 border border-slate-600 text-slate-400 hover:text-white transition-colors"
              aria-label="Learn about days remaining"
            >
              <Info className="w-3 h-3" strokeWidth={2.5} />
            </button>
          }
        />
      </div>
    </div>
  );
}
