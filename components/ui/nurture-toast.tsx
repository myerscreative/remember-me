'use client';

import { toast } from "sonner";
import { Sprout, CheckCircle2 } from "lucide-react";

export const showNurtureToast = (name: string) => {
  toast.custom((t) => (
    <div className="flex items-center gap-4 bg-[#161926] border border-emerald-500/30 p-4 rounded-2xl shadow-2xl min-w-[300px] animate-in slide-in-from-bottom-4">
      {/* Animated Icon Container */}
      <div className="h-10 w-10 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
        <Sprout size={20} className="animate-bounce" />
      </div>
      
      <div className="flex-1">
        <h4 className="text-sm font-bold text-white">Connection Nurtured</h4>
        <p className="text-[11px] text-slate-400">
          Your garden seed for <span className="text-emerald-400 font-semibold">{name}</span> is healthy.
        </p>
      </div>

      <button 
        onClick={() => toast.dismiss(t)}
        className="text-slate-600 hover:text-white transition-colors"
      >
        <CheckCircle2 size={18} />
      </button>
    </div>
  ), {
    duration: 3000,
    position: 'bottom-center',
  });
};
