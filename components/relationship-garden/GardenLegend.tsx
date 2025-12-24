import React from 'react';

export default function GardenLegend() {
  return (
    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
        📍 Guide
      </div>
      
      <div className="space-y-4">
        {/* Rings */}
        <div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mb-2">DISTANCE FROM CENTER</div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Blooming (Inner Circle)</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full bg-lime-500"></span>
              <span>Nourished</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
              <span>Thirsty</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full bg-orange-500"></span>
              <span>Fading</span>
            </div>
          </div>
        </div>

        {/* Separator */}
        <div className="h-px bg-slate-100 dark:bg-slate-800"></div>

        {/* Leaf Sizes */}
        <div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mb-2">LEAF SIZE by Importance</div>
          <div className="flex items-end gap-3">
            <div className="flex flex-col items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-600"></div>
              <span className="text-[10px] text-slate-500">Casual</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-4 h-4 rounded-full bg-slate-400 dark:bg-slate-500"></div>
              <span className="text-[10px] text-slate-500">Medium</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-6 h-6 rounded-full bg-slate-600 dark:bg-slate-400"></div>
              <span className="text-[10px] text-slate-500 font-medium">High</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
