import React from 'react';

interface NetworkHeaderProps {
  viewMode: 'compact' | 'standard' | 'detailed';
  setViewMode: (mode: 'compact' | 'standard' | 'detailed') => void;
}

export default function NetworkHeader({ viewMode, setViewMode }: NetworkHeaderProps) {
  return (
    <header className="flex items-center justify-between py-4 px-4 md:px-8 bg-[#fafafa] border-b border-[#e5e7eb]">
      <h1 className="text-2xl font-semibold text-[#111827]">Network</h1>
      <div className="flex space-x-2">
        <a
          href="/network/deduplicate"
          className="px-3 py-1 rounded-md bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 flex items-center gap-1 transition-colors"
        >
          ✨ Clean Up
        </a>
        <div className="w-px h-8 bg-gray-200 mx-2 self-center"></div>
        <button
          className={`px-3 py-1 rounded-md ${viewMode === 'compact' ? 'bg-[#6366f1] text-white' : 'bg-white text-[#111827]'} border border-[#e5e7eb]`}
          onClick={() => setViewMode('compact')}
        >
          🔍 Compact
        </button>
        <button
          className={`px-3 py-1 rounded-md ${viewMode === 'standard' ? 'bg-[#6366f1] text-white' : 'bg-white text-[#111827]'} border border-[#e5e7eb]`}
          onClick={() => setViewMode('standard')}
        >
          📋 Standard
        </button>
        <button
          className={`px-3 py-1 rounded-md ${viewMode === 'detailed' ? 'bg-[#6366f1] text-white' : 'bg-white text-[#111827]'} border border-[#e5e7eb]`}
          onClick={() => setViewMode('detailed')}
        >
          📄 Detailed
        </button>
      </div>
    </header>
  );
}
