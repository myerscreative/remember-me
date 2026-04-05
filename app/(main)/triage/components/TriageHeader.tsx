'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Info } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface TriageHeaderProps {
  isEnrichment?: boolean;
}

export default function TriageHeader({ isEnrichment }: TriageHeaderProps) {
  return (
    <div className="mb-4">
      {/* Slim top-row navigation bar */}
      <div className="flex items-center justify-between py-2 mb-4 border-b border-border-default">
        <Link 
          href="/" 
          className="inline-flex items-center text-xs font-medium text-text-tertiary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Back to Dashboard
        </Link>
        <Link 
          href="/garden"
          className="text-xs font-bold text-text-primary hover:opacity-70 transition-opacity flex items-center"
        >
          Finish & View Garden 
          <span className="ml-1 text-base">→</span>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <span>{isEnrichment ? '✨ Garden Enrichment' : '🌱 Garden Prep'}</span>
          <Popover>
            <PopoverTrigger asChild>
              <button className="cursor-pointer text-text-tertiary hover:text-text-secondary transition-colors focus:outline-none">
                <Info className="w-5 h-5" />
              </button>
            </PopoverTrigger>
            <PopoverContent 
              side="bottom" 
              align="start" 
              className="w-72 p-4 bg-surface border-border-default shadow-xl rounded-xl z-50"
            >
              <p className="text-sm text-text-secondary leading-relaxed">
                {isEnrichment 
                  ? "Help your garden grow by adding specific notes or context to these contacts. This allows the AI to generate deeper, more meaningful relationship insights."
                  : "Unplanted Seeds are contacts who haven't been assigned a priority yet. Once you choose a level, they are planted in your Garden Map."
                }
              </p>
            </PopoverContent>
          </Popover>
        </h1>
      </div>
    </div>
  );
}
