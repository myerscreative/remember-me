"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, Clock, Trophy, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GameStats } from "@/hooks/useGameStats";

interface GameShellProps {
  title: string;
  durationSeconds: number;
  currentScore: number;
  onTimerTick?: (remaining: number) => void;
  onTimeUp: () => void;
  onExit: () => void;
  children: React.ReactNode;
  isActive: boolean; // Is game running?
}

export function GameShell({ 
  title, 
  durationSeconds, 
  currentScore, 
  onTimeUp, 
  onExit, 
  children,
  isActive 
}: GameShellProps) {
  const [timeLeft, setTimeLeft] = useState(durationSeconds);

  useEffect(() => {
    if (!isActive) return;
    
    setTimeLeft(durationSeconds);
    
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, durationSeconds, onTimeUp]);

  // Format time mm:ss
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <Button variant="ghost" size="sm" onClick={onExit} className="gap-1 text-gray-500 hover:text-red-500">
           <ArrowLeft size={18} /> Quit
        </Button>
        
        <div className="flex divide-x divide-gray-200">
            <div className="px-6 flex flex-col items-center">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Time</span>
                <span className={`text-2xl font-black font-mono ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-gray-800'}`}>
                    {formatTime(timeLeft)}
                </span>
            </div>
            <div className="px-6 flex flex-col items-center">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Score</span>
                <span className="text-2xl font-black text-indigo-600 animate-in zoom-in duration-300 key={currentScore}">
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
        <div className="max-w-md mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 mt-12 animate-in slide-in-from-bottom-8 fade-in duration-700">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-10 text-center text-white">
                <div className="inline-flex items-center justify-center p-4 bg-white/20 rounded-full mb-6 backdrop-blur-md">
                   <Trophy size={48} className="text-yellow-300 drop-shadow-md" />
                </div>
                <h2 className="text-4xl font-black mb-2">{score} pts</h2>
                <div className="text-indigo-100 font-medium">Final Score</div>
            </div>
            
            <div className="p-8">
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="p-4 bg-gray-50 rounded-2xl text-center border border-gray-100">
                        <div className="text-xs font-bold text-gray-400 uppercase mb-1">Best</div>
                        <div className="text-xl font-bold text-gray-900">{Math.max(score, bestScore)}</div>
                        {score >= bestScore && score > 0 && <span className="text-xs text-green-600 font-bold">NEW RECORD!</span>}
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl text-center border border-gray-100">
                        <div className="text-xs font-bold text-gray-400 uppercase mb-1">XP Earned</div>
                        <div className="text-xl font-bold text-indigo-600">+{xpEarned}</div>
                    </div>
                </div>

                {streak > 1 && (
                    <div className="flex items-center justify-center gap-2 p-3 bg-orange-50 text-orange-700 rounded-xl mb-8 border border-orange-100">
                        <Flame size={20} className="fill-orange-500 text-orange-600" />
                        <span className="font-bold">{streak} Day Streak!</span>
                    </div>
                )}

                <div className="space-y-3">
                    <Button onClick={onPlayAgain} className="w-full py-6 text-lg font-bold bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-200">
                        Play Again
                    </Button>
                    <Button variant="ghost" onClick={onExit} className="w-full py-6 text-gray-500 hover:text-gray-900">
                        Back to Menu
                    </Button>
                </div>
            </div>
        </div>
    )
}
