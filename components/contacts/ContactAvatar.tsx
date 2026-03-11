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

      {/* Health Score with info badge overlay */}
      <div
        className="absolute bottom-0 right-0 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          id="tour-health-score"
          className={cn(
            'relative w-12 h-12 rounded-full border-4 border-slate-950 shadow-md flex items-center justify-center text-white font-sans font-bold text-sm',
            getHealthColor(healthScore)
          )}
        >
          {Math.round(healthScore)}
          <Link
            href="/field-guide#health-score"
            onClick={(e) => e.stopPropagation()}
            className="absolute -top-0.5 -right-0.5 min-w-[44px] min-h-[44px] w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-white hover:bg-indigo-400 active:scale-95 transition-colors shadow-md -m-2"
            aria-label="Learn about Health Score"
          >
            <Info className="w-3.5 h-3.5" strokeWidth={2.5} />
          </Link>
        </div>
      </div>
    </div>
  );
}
