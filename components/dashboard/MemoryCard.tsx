import React from 'react';
import { ChevronRight, Zap } from 'lucide-react';
import { SharedMemoryCard } from '@/types/memory';

const MemoryCard: React.FC<{ memory: SharedMemoryCard; onClick?: () => void }> = ({ memory, onClick }) => {
  // Logic to map internal status to our "Garden" color discipline
  const isBlooming = memory.statusLabel?.toUpperCase() === 'BLOOMING';
  
  const statusColor = isBlooming 
    ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]' 
    : {
        Nurtured: 'text-emerald-400',
        Drifting: 'text-amber-400',
        Neglected: 'text-rose-400'
      }[memory.status];

  const dotColor = isBlooming
    ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]'
    : {
        Nurtured: 'bg-emerald-500',
        Drifting: 'bg-amber-500',
        Neglected: 'bg-rose-500'
      }[memory.status];

  return (
    <div className="w-full mb-4 p-5 rounded-3xl border border-white/5 bg-slate-950/40 backdrop-blur-xl shadow-2xl transition-all duration-500 hover:border-indigo-500/30">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          {/* Avatar with Ring */}
          <div className="relative">
             <div className={`absolute -inset-1 rounded-full blur-[2px] opacity-20 ${dotColor.replace('bg-', 'bg-')}`} />
             <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 border-2 border-white/10 text-slate-100 font-bold shadow-xl overflow-hidden">
               {memory.initials}
             </div>
          </div>
          
          {/* Contact Info */}
          <div>
            <h3 className="text-slate-100 font-black text-lg tracking-tight leading-tight">
              {memory.contactName}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`h-1.5 w-1.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)] ${dotColor}`} />
              <span className={`text-[11px] font-black tracking-[0.15em] uppercase ${statusColor} drop-shadow-sm`}>
                {memory.statusLabel}
              </span>
            </div>
          </div>
        </div>

        <button 
          className="h-10 w-10 flex items-center justify-center rounded-full bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-300 active:scale-90"
          onClick={onClick}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Content Area - The Glass "Well" */}
      <div className="relative group cursor-pointer w-full p-4 rounded-2xl bg-black/40 border border-white/5 hover:border-indigo-500/40 transition-all duration-500 shadow-inner overflow-hidden">
        {/* Subtle Gradient Overlay */}
        <div className="absolute inset-0 bg-linear-to-br from-indigo-500/5 to-transparent pointer-events-none" />
        
        <div className="flex items-start gap-3 relative z-10">
          {memory.isQuickLog && (
            <Zap size={16} className="text-indigo-400 mt-1 shrink-0 animate-pulse" />
          )}
          <p className="text-slate-200 italic font-semibold leading-relaxed text-sm">
            &quot;{memory.content}&quot;
          </p>
        </div>
      </div>
    </div>
  );
};

export default MemoryCard;
