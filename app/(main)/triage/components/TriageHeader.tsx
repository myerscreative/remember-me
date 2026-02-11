'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Info } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export default function TriageHeader() {
  return (
    <div className="mb-4">
      {/* Slim top-row navigation bar */}
      <div className="flex items-center justify-between py-2 mb-4 border-b border-slate-100 dark:border-slate-800/50">
        <Link 
          href="/" 
          className="inline-flex items-center text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Back to Dashboard
        </Link>
        <Link 
          href="/garden"
          className="text-xs font-bold text-slate-900 dark:text-white hover:opacity-70 transition-opacity flex items-center"
        >
          Finish & View Garden 
          <span className="ml-1 text-base">→</span>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span>🌱 Garden Prep</span>
          <Popover>
            <PopoverTrigger asChild>
              <button className="cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none">
                <Info className="w-5 h-5" />
              </button>
            </PopoverTrigger>
            <PopoverContent 
              side="bottom" 
              align="start" 
              className="w-72 p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl rounded-xl z-50"
            >
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Unplanted Seeds are contacts who haven&apos;t been assigned a priority yet. Categorize them here to see them grow in your Garden Map.
              </p>
            </PopoverContent>
          </Popover>
        </h1>
      </div>
    </div>
  );
}
