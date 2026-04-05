"use client";

import React from "react";
import { ArrowLeft, Trophy, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useGameTimer, formatGameTime } from "@/hooks/useGameTimer";

export interface GameShellProps {
  title: string;
  durationSeconds: number;
  currentScore: number;
  onTimerTick?: (remaining: number) => void;
  onTimeUp: () => void;
  onExit: () => void;
  children: React.ReactNode;
  isActive: boolean;
}

export function GameShell({
  title,
  durationSeconds,
  currentScore,
  onTimeUp,
  onExit,
  children,
  isActive,
}: GameShellProps) {
  const timeLeft = useGameTimer(durationSeconds, isActive, onTimeUp);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6 bg-surface p-4 rounded-2xl shadow-sm border border-border-default">
        <Button variant="ghost" size="sm" onClick={onExit} className="gap-1 text-text-secondary hover:text-red-500 dark:hover:text-red-400">
           <ArrowLeft size={18} /> Quit
        </Button>
        
        <div className="flex divide-x divide-border-default">
            <div className="px-6 flex flex-col items-center">
                <span className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-1">Time</span>
                <span className={cn("text-2xl font-black font-mono", timeLeft < 10 ? "animate-pulse text-red-500" : "text-text-primary")}>
                    {formatGameTime(timeLeft)}
                </span>
            </div>
            <div className="px-6 flex flex-col items-center">
                <span className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-1">Score</span>
                <span className="text-2xl font-black text-text-accent animate-in zoom-in duration-300">
                    {currentScore}
                </span>
            </div>
        </div>
      </div>
      
      
      <div className="relative">
          {children}
      </div>
    </div>
  );
}

interface GameOverProps {
    score: number;
    bestScore: number;
    streak: number;
    xpEarned: number;
    onPlayAgain: () => void;
    onExit: () => void;
}

export function GameOverScreen({ score, bestScore, streak, xpEarned, onPlayAgain, onExit }: GameOverProps) {
    return (
        <div className="max-w-md mx-auto bg-surface rounded-3xl shadow-2xl overflow-hidden border border-border-default mt-12 animate-in slide-in-from-bottom-8 fade-in duration-700">
            <div className="bg-linear-to-br from-indigo-600 to-purple-700 p-10 text-center text-white">
                <div className="inline-flex items-center justify-center p-4 bg-white/20 rounded-full mb-6 backdrop-blur-md">
                   <Trophy size={48} className="text-yellow-300 drop-shadow-md" />
                </div>
                <h2 className="text-4xl font-black mb-2">{score} pts</h2>
                <div className="text-indigo-100 font-medium">Final Score</div>
            </div>
            
            <div className="p-8">
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="p-4 bg-canvas rounded-2xl text-center border border-border-default">
                        <div className="text-xs font-bold text-text-secondary uppercase mb-1">Best</div>
                        <div className="text-xl font-bold text-text-primary">{Math.max(score, bestScore)}</div>
                        {score >= bestScore && score > 0 && <span className="text-xs text-green-600 font-bold">NEW RECORD!</span>}
                    </div>
                    <div className="p-4 bg-canvas rounded-2xl text-center border border-border-default">
                        <div className="text-xs font-bold text-text-secondary uppercase mb-1">XP Earned</div>
                        <div className="text-xl font-bold text-text-accent">+{xpEarned}</div>
                    </div>
                </div>

                {streak > 1 && (
                    <div className="flex items-center justify-center gap-2 p-3 bg-orange-50 text-orange-700 rounded-xl mb-8 border border-orange-100">
                        <Flame size={20} className="fill-orange-500 text-orange-600" />
                        <span className="font-bold">{streak} Day Streak!</span>
                    </div>
                )}

                <div className="space-y-3">
                    <Button onClick={onPlayAgain} className="w-full py-6 text-lg font-bold bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-200 dark:shadow-none">
                        Play Again
                    </Button>
                    <Button variant="ghost" onClick={onExit} className="w-full py-6 text-text-secondary hover:text-text-primary">
                        Back to Menu
                    </Button>
                </div>
            </div>
        </div>
    )
}
