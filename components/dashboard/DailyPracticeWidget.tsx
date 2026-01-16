"use client";

import { Brain, Star, Flame, Trophy, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useGameStats } from "@/hooks/useGameStats";
import { useEffect, useState } from "react";

export function DailyPracticeWidget() {
  const router = useRouter();
  const { stats, isLoaded } = useGameStats();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isLoaded || !isClient) return null;

  // Simple logic: if played today, challenge complete? 
  // Ideally useGameStats would have 'dailyChallengeComplete' flag.
  // For MVP, we check if gamesPlayed incremented today? 
  // Or just "Master Your Top 10" is a placeholder for now as per plan.
  // Let's assume stats.lastPlayedDate === today means "Complete" for MVP simplicity.
  
  const today = new Date().toISOString().split('T')[0];
  const lastPlayed = stats.lastPlayedDate ? stats.lastPlayedDate.split('T')[0] : null;
  const isComplete = lastPlayed === today;
  
  // Progress (Fake for MVP or based on games count?)
  // Let's say goal is 1 game per day.
  // const goal = 1;

  if (isComplete) {
      return (
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm relative overflow-hidden group hover:border-green-200 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-5">
                <Trophy size={100} className="transform rotate-12" />
            </div>
            
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2 text-green-600 font-bold text-sm uppercase tracking-wider">
                        <CheckCircle2 size={16} /> Daily Goal Complete
                    </div>
                </div>
                
                <h3 className="text-lg font-bold text-gray-900 mb-1">Great job today!</h3>
                <p className="text-gray-500 text-sm mb-4">
                    You kept your {stats.currentStreak} day streak alive.
                </p>
                
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => router.push('/practice')}
                    className="w-full sm:w-auto bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 border-green-200"
                >
                    Practice More <ArrowRight size={14} className="ml-1" />
                </Button>
            </div>
        </div>
      )
  }

  return (
    <div className="bg-linear-to-br from-indigo-600 to-purple-700 rounded-xl p-4 text-white shadow-lg relative overflow-hidden group">
      {/* Background Decor */}
      <div className="absolute -top-4 -right-4 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-700 pointer-events-none">
        <Brain size={80} />
      </div>

      <div className="relative z-10 flex items-center justify-between">
        <div className="flex-1">
             <div className="flex items-center gap-2 mb-1">
                <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    <Star size={10} className="fill-yellow-300 text-yellow-300" /> Daily Challenge
                </div>
                {stats.currentStreak > 0 && (
                    <div className="flex items-center gap-1 text-orange-200 font-bold text-[10px]">
                        <Flame size={10} className="fill-orange-400 text-orange-400" /> 
                        {stats.currentStreak} Day Streak
                    </div>
                )}
             </div>

            <div className="flex items-center gap-4">
                <h3 className="text-lg font-bold">Master Your Network</h3>
                <p className="text-indigo-100 text-xs hidden md:block">
                Keep the streak alive!
                </p>
            </div>
        </div>

        <div className="flex items-center gap-2">
             <div className="hidden md:block bg-black/20 rounded-lg px-2 py-1.5 text-[10px] font-medium text-indigo-200">
                 +100 XP
             </div>
             <Button 
                onClick={() => router.push('/practice')}
                size="sm"
                className="bg-white text-indigo-600 hover:bg-indigo-50 font-bold border-0 shadow-md h-8 text-xs px-3"
             >
                Start <ArrowRight size={14} className="ml-1.5" />
             </Button>
        </div>
      </div>
    </div>
  );
}
