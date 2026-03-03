import React from 'react';
import { ChevronRight, Zap } from 'lucide-react';
import { SharedMemoryCard } from '@/types/memory';

const MemoryCard: React.FC<{ memory: SharedMemoryCard; onClick?: () => void }> = ({ memory, onClick }) => {
  // Logic to map internal status to our "Garden" color discipline
  const statusColor = {
    Nurtured: 'text-emerald-400', // Green
    Drifting: 'text-orange-400',  // Orange
    Neglected: 'text-red-400',    // Red
  }[memory.status];

  const dotColor = {
    Nurtured: 'bg-emerald-400',
    Drifting: 'bg-orange-400',
    Neglected: 'bg-red-400',
  }[memory.status];

  return (
    <div className="w-full mb-4 p-5 rounded-2xl border border-slate-200/10 bg-slate-900/40 backdrop-blur-md">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 border border-slate-700 text-slate-200 font-bold shadow-inner">
            {memory.initials}
          </div>
          
          {/* Contact Info */}
          <div>
            <h3 className="text-white font-bold text-lg leading-tight">
              {memory.contactName}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`h-2 w-2 rounded-full animate-pulse ${dotColor}`} />
              <span className={`text-[10px] font-black tracking-widest uppercase ${statusColor}`}>
                {memory.statusLabel}
              </span>
            </div>
          </div>
        </div>

        <button 
          className="text-slate-400 hover:text-slate-200 transition-colors"
          onClick={onClick}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Content Area - The "Integrated Well" replace for the white box */}
      <div className="relative group cursor-pointer w-full p-4 rounded-xl bg-slate-950/50 border border-slate-800 hover:border-indigo-500/50 transition-all duration-300">
        <div className="flex items-start gap-3">
          {memory.isQuickLog && (
            <Zap size={16} className="text-indigo-400 mt-1 shrink-0" />
          )}
          <p className="text-slate-300 italic font-medium leading-relaxed">
            &quot;{memory.content}&quot;
          </p>
        </div>
      </div>
    </div>
  );
};

export default MemoryCard;
