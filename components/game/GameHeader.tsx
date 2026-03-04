import React from "react";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export interface GameHeaderProps {
  score: number;
  streak?: number;
  timeLeft?: number;
  onBack: () => void;
  title?: string;
  icon?: string;
}

function GameHeaderComponent({ score, streak, timeLeft, onBack, title, icon }: GameHeaderProps) {
  return (
    <div className="max-w-2xl mx-auto mb-6">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition"
        >
           <ArrowLeft className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-4">
           {title && (
               <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm text-slate-700 font-bold">
                   {icon && <span>{icon}</span>}
                   {title}
               </div>
           )}

          <div className="px-4 py-2 bg-white rounded-xl shadow-sm min-w-[100px] text-center">
            <span className="text-xs text-slate-500 uppercase font-bold block">Score</span>
            <div className="text-xl font-bold text-indigo-600">{score}</div>
          </div>
          
          {streak !== undefined && streak > 0 && (
            <div className="px-4 py-2 bg-linear-to-r from-amber-100 to-orange-100 rounded-xl border-2 border-orange-200">
              <span className="text-sm text-orange-700 font-bold flex items-center gap-1">
                  🔥 {streak}
              </span>
            </div>
          )}

           {timeLeft !== undefined && (
            <div className={cn("min-w-[80px] rounded-xl px-4 py-2 text-center shadow-sm", timeLeft <= 10 ? "animate-pulse border border-red-200 bg-red-50 text-red-600" : "bg-white text-slate-700")}>
              <span className="text-xs text-slate-500 uppercase font-bold block">Time</span>
              <div className="text-xl font-bold">{timeLeft}s</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export const GameHeader = React.memo(GameHeaderComponent);
