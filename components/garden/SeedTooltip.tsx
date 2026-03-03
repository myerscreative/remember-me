import React from 'react';

export interface SeedPreview {
  contactId: string;
  name: string;
  status: 'Nurtured' | 'Drifting' | 'Neglected';
  daysSinceLastContact: number;
  lastInteractionType: 'call' | 'text' | 'meeting' | 'memory' | string;
}

export function SeedTooltip({ data, onOpenProfile }: { data: SeedPreview, onOpenProfile?: () => void }) {
  // Map status to our specific color discipline
  const statusColors = {
    Nurtured: 'border-emerald-500 text-emerald-400',
    Drifting: 'border-orange-500 text-orange-400',
    Neglected: 'border-red-500 text-red-400',
  };

  const isNeglected = data.status === 'Neglected';

  return (
    <div 
      className={`absolute -top-24 left-1/2 -translate-x-1/2 w-48 bg-slate-900 border-2 ${statusColors[data.status]} p-3 rounded-xl shadow-2xl z-50 ${isNeglected ? 'animate-pulse' : ''}`}
      onClick={(e) => e.stopPropagation()} // Prevent closing when interacting with tooltip
    >
      <div className="flex justify-between items-start mb-1">
        <h4 className="font-bold text-white text-sm truncate pr-2">{data.name}</h4>
        <span className="text-[10px] font-mono opacity-60 text-white shrink-0">
          {data.daysSinceLastContact}d ago
        </span>
      </div>
      
      <p className="text-[11px] text-slate-400 mb-3 capitalize">
        Last: {data.lastInteractionType || 'unknown'}
      </p>

      <button 
        className="w-full bg-indigo-600 text-[11px] font-bold py-1.5 rounded-lg text-white hover:bg-indigo-500 transition-colors"
        onClick={onOpenProfile}
      >
        Open Profile
      </button>
      
      {/* Tooltip Tail */}
      <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-900 border-r-2 border-b-2 ${statusColors[data.status]} rotate-45`} />
    </div>
  );
}
