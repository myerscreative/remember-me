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
    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl p-6 text-white shadow-lg relative overflow-hidden group">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-700">
        <Brain size={120} />
      </div>

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                <Star size={12} className="fill-yellow-300 text-yellow-300" /> Daily Challenge
            </div>
            {stats.currentStreak > 0 && (
                <div className="flex items-center gap-1 text-orange-300 font-bold bg-black/20 px-2 py-1 rounded-lg text-xs">
                    <Flame size={12} className="fill-orange-500 text-orange-500" /> 
                    {stats.currentStreak} Day Streak
                </div>
            )}
        </div>

        <h3 className="text-xl font-bold mb-2">Master Your Network</h3>
        <p className="text-indigo-100 text-sm mb-6 max-w-[280px]">
           Complete a quick 60-second Face Match session to keep your streak!
        </p>

        <div className="flex items-center gap-3">
             <Button 
                onClick={() => router.push('/practice')}
                className="bg-white text-indigo-600 hover:bg-indigo-50 font-bold border-0 shadow-xl"
             >
                Start Practice <ArrowRight size={16} className="ml-2" />
             </Button>
             <div className="bg-black/20 rounded-lg px-3 py-2 text-xs font-medium text-indigo-200">
                 +100 XP Reward
             </div>
        </div>
      </div>
    </div>
  );
}
