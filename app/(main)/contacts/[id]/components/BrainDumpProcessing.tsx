'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

interface BrainDumpProcessingProps {
  name: string;
}

export const BrainDumpProcessing = ({ name }: BrainDumpProcessingProps) => {
  return (
    <div className="p-8 bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-indigo-500/50 text-center shadow-2xl shadow-indigo-500/10 overflow-hidden relative">
      {/* Animated Background Elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-indigo-500 to-transparent animate-shimmer" />
      
      <div className="flex justify-center mb-6 relative">
        <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full animate-pulse" />
        <Sparkles size={48} className="text-indigo-400 relative animate-bounce" />
      </div>
      
      <h3 className="text-white font-black text-2xl mb-3 tracking-tight">Analyzing Your Connection...</h3>
      <p className="text-slate-400 text-sm leading-relaxed max-w-[280px] mx-auto">
        Updating <span className="text-indigo-300 font-bold">{name}&apos;s</span> Story, Family, and Health Score based on your chat.
      </p>

      {/* Visual Feedback: Small dots moving to different tabs */}
      <div className="mt-8 flex justify-center items-center gap-8 relative h-12">
        <div className="flex flex-col items-center gap-1 opacity-50">
          <div className="w-2 h-2 rounded-full bg-slate-700" />
          <span className="text-[10px] uppercase font-bold text-slate-500">Story</span>
        </div>
        <div className="flex flex-col items-center gap-1 opacity-50">
          <div className="w-2 h-2 rounded-full bg-slate-700" />
          <span className="text-[10px] uppercase font-bold text-slate-500">Family</span>
        </div>
        <div className="flex flex-col items-center gap-1 opacity-50">
          <div className="w-2 h-2 rounded-full bg-slate-700" />
          <span className="text-[10px] uppercase font-bold text-slate-500">Health</span>
        </div>

        {/* Flying Dots */}
        <div className="absolute left-1/2 top-0 -translate-x-1/2 w-4 h-4">
           <div className="w-2 h-2 bg-indigo-400 rounded-full absolute animate-[ping_2s_infinite]" />
           <div className="w-2 h-2 bg-indigo-400 rounded-full absolute animate-[flyToStory_3s_infinite]" style={{ animationDelay: '0s' }} />
           <div className="w-2 h-2 bg-purple-400 rounded-full absolute animate-[flyToFamily_3.5s_infinite]" style={{ animationDelay: '1s' }} />
           <div className="w-2 h-2 bg-emerald-400 rounded-full absolute animate-[flyToHealth_2.5s_infinite]" style={{ animationDelay: '0.5s' }} />
        </div>
      </div>

      <style jsx>{`
        @keyframes flyToStory {
          0% { transform: translate(0, 0) scale(1); opacity: 0; }
          20% { opacity: 1; }
          80% { transform: translate(-80px, 0) scale(0.5); opacity: 1; }
          100% { transform: translate(-80px, 0) scale(0); opacity: 0; }
        }
        @keyframes flyToFamily {
          0% { transform: translate(0, 0) scale(1); opacity: 0; }
          20% { opacity: 1; }
          80% { transform: translate(0, 0) scale(0.5); opacity: 1; }
          100% { transform: translate(0, 0) scale(0); opacity: 0; }
        }
        @keyframes flyToHealth {
          0% { transform: translate(0, 0) scale(1); opacity: 0; }
          20% { opacity: 1; }
          80% { transform: translate(80px, 0) scale(0.5); opacity: 1; }
          100% { transform: translate(80px, 0) scale(0); opacity: 0; }
        }
        .animate-shimmer {
          background-size: 200% 100%;
          animation: shimmer 2s infinite linear;
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
};
