import React from 'react';
import { cn } from '@/lib/utils';

interface NetworkHeaderProps {
  viewMode: 'compact' | 'standard' | 'detailed';
  setViewMode: (mode: 'compact' | 'standard' | 'detailed') => void;
}

export default function NetworkHeader({ viewMode, setViewMode }: NetworkHeaderProps) {
  return (
    <header className="flex items-center justify-between py-4 px-4 md:px-8 bg-canvas border-b border-border-default">
      <h1 className="text-2xl font-semibold text-text-primary">Network</h1>
      <div className="flex space-x-2">
        <a
          href="/network/deduplicate"
          className="px-3 py-1 rounded-md bg-surface text-indigo-600 border border-indigo-200 hover:bg-indigo-50 flex items-center gap-1 transition-colors"
        >
          ✨ Clean Up
        </a>
        <div className="w-px h-8 bg-border-default mx-2 self-center"></div>
        <button
          className={cn("rounded-md border border-border-default px-3 py-1", viewMode === "compact" ? "bg-[#6366f1] text-white" : "bg-surface text-text-primary")}
          onClick={() => setViewMode('compact')}
        >
          🔍 Compact
        </button>
        <button
          className={cn("rounded-md border border-border-default px-3 py-1", viewMode === "standard" ? "bg-[#6366f1] text-white" : "bg-surface text-text-primary")}
          onClick={() => setViewMode('standard')}
        >
          📋 Standard
        </button>
        <button
          className={cn("rounded-md border border-border-default px-3 py-1", viewMode === "detailed" ? "bg-[#6366f1] text-white" : "bg-surface text-text-primary")}
          onClick={() => setViewMode('detailed')}
        >
          📄 Detailed
        </button>
      </div>
    </header>
  );
}
