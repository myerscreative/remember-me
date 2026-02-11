"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Lightbulb, Trophy, Star, Zap } from "lucide-react";

import { GameSetupModal } from "@/components/game/GameSetupModal";
import { useGameStats } from "@/hooks/useGameStats";
import { getBloomingContactsAction } from "@/app/actions/get-blooming-contacts";

// Types
interface GameMode {
  id: string;
  icon: React.ReactNode;
  iconColor: string;
  title: string;
  description: string;
  category: 'quick' | 'focus' | 'challenge';
}

interface DailyChallenge {
  title: string;
  description: string;
  reward: number;
  progress: number;
  total: number;
  completed: boolean;

}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress?: number;
  total?: number;
}

// Helper to convert hex to rgb for CSS variables
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}` : '0 0 0';
};

export default function GameCenterPage() {
  const router = useRouter();
  const { stats, isLoaded } = useGameStats();
  const [resetTime, setResetTime] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  // Derived stats
  // Level N starts at THRESHOLD[N-1]
  const LEVEL_THRESHOLDS = [0, 500, 1500, 5000, 15000, 50000];
  const currentLevelBaseXP = LEVEL_THRESHOLDS[stats.level - 1] || 0;
  const nextLevelXP = LEVEL_THRESHOLDS[stats.level] || 100000;
  // Ensure we don't divide by zero and handle edge cases
  const xpInLevel = Math.max(0, stats.totalXP - currentLevelBaseXP);
  const xpRequired = Math.max(1, nextLevelXP - currentLevelBaseXP);
  const xpProgress = Math.min(100, (xpInLevel / xpRequired) * 100);

  // Mock data for Daily Challenge - Replace with real logic later
  // For now we'll pretend there's a daily goal of 100 XP or 1 game
  // State for real daily challenge data
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallenge>({
    title: 'Master Your Top 10',
    description: 'Practice these 10 contacts you interact with the most.',
    reward: 200,
    progress: 0,
    total: 10,
    completed: false,
  });

  // Load real blooming contacts
  useEffect(() => {
    async function fetchBlooming() {
      const res = await getBloomingContactsAction(10);
      if (res.data) {
        setDailyChallenge(prev => ({
          ...prev,
          progress: res.data.length,
          completed: res.data.length >= prev.total
        }));
      }
    }
    fetchBlooming();
  }, []);

  const gameModes: GameMode[] = [
    {
      id: 'face-match',
      icon: <User size={32} />,
      iconColor: '#667eea', // Indigo
      title: 'Face Match',
      description: 'Match faces to names against the clock. Can you beat your high score?',
      category: 'quick',
    },
    {
      id: 'fact-match',
      icon: <Lightbulb size={32} />,
      iconColor: '#ec4899', // Pink
      title: 'Fact Match',
      description: 'Who works where? Who likes what? Connect the details to the right person.',
      category: 'quick',
    },
    {
      id: 'interest-match',
      icon: <span className="text-3xl">🎣</span>,
      iconColor: '#10b981', // Emerald
      title: 'Interest Match',
      description: 'Who loves fishing? Who plays guitar? Test your knowledge of their passions.',
      category: 'focus',
    },
    {
      id: 'story-recall',
      icon: <span className="text-3xl">📖</span>,
      iconColor: '#f59e0b', // Amber
      title: 'Story Recall',
      description: 'Remember where you met, what you talked about, and why they matter.',
      category: 'focus',
    },
    {
      id: 'quick-fire',
      icon: <span className="text-3xl">⚡</span>,
      iconColor: '#ef4444', // Red
      title: 'Quick Fire',
      description: '60 seconds. 15 questions. How many can you answer correctly?',
      category: 'challenge',
    },
    {
      id: 'event-prep',
      icon: <span className="text-3xl">🎪</span>,
      iconColor: '#8b5cf6', // Violet
      title: 'Event Prep',
      description: 'Practice everyone attending your next event. Walk in confident!',
      category: 'challenge',
    },
  ];

  const achievements: Achievement[] = [
    {
      id: 'first-win',
      title: 'First Win',
      description: 'Complete your first game',
      icon: '🏆',
      unlocked: stats.gamesPlayed > 0,
    },
    {
      id: 'hot-streak',
      title: 'Hot Streak',
      description: 'Maintain a 10-day streak',
      icon: '🔥',
      unlocked: stats.currentStreak >= 10,
      progress: stats.currentStreak,
      total: 10,
    },
    {
      id: 'perfect-round',
      title: 'Perfect Round',
      description: '100% accuracy in a game',
      icon: '💯',
      unlocked: false, // Need to track this in stats
    },
    {
      id: 'speed-demon',
      title: 'Speed Demon',
      description: 'Answer 10 questions in 30 seconds',
      icon: '⚡',
      unlocked: false,
    },
  ];



  // Timer logic
  const getTimeUntilReset = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const diff = tomorrow.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  useEffect(() => {
    // Set mounted state in next tick to avoid hydration mismatch and lint warning
    const timer = setTimeout(() => setIsMounted(true), 0);
    
    // Calculate immediately on mount
    const updateTimer = () => {
      setResetTime(getTimeUntilReset());
    };
    
    updateTimer(); // Initial call
    
    const interval = setInterval(updateTimer, 60000); 
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  const [selectedGame, setSelectedGame] = useState<GameMode | null>(null);
  const [isSetupOpen, setIsSetupOpen] = useState(false);

  const handleGameLaunch = (gameId: string) => {
      const game = gameModes.find(g => g.id === gameId);
      if (game) {
          setSelectedGame(game);
          setIsSetupOpen(true);
      }
  };

  const handleStartGame = (config: { filterType: string; filterValue?: string }) => {
      if (!selectedGame) return;
      setIsSetupOpen(false);
      
      const params = new URLSearchParams();
      if (config.filterType !== 'all') {
          params.append('filter', config.filterType);
          if (config.filterValue) {
              params.append('value', config.filterValue);
          }
      }
      
      router.push(`/practice/${selectedGame.id}?${params.toString()}`);
  };



  if (!isLoaded) return null;

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-[#111827] pb-20 transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#111827]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
              >
                <ArrowLeft size={24} />
              </button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Game Center</h1>
            </div>

            <div className="flex items-center gap-2">
               {/* Placeholders for settings/profile if needed */}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Level & Stats Card */}
        <div className="bg-white dark:bg-[#1f2937] rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 mb-8 transition-all hover:shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
            <div>
              <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                Current Level
              </p>
              <div className="flex items-baseline gap-3">
                <h2 className="text-4xl font-black text-gray-900 dark:text-white">Level {stats.level}</h2>
                <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">Pro Networker</span>
              </div>
            </div>

            <div className="flex items-center gap-4 px-6 py-4 bg-linear-to-br from-orange-50 to-red-50 dark:from-orange-900/10 dark:to-red-900/10 rounded-2xl border border-orange-100 dark:border-orange-500/10 shadow-sm">
              <div className="bg-white dark:bg-[#1f2937] p-2 rounded-xl shadow-sm">
                  <span className="text-2xl">🔥</span>
              </div>
              <div>
                <p className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">Streak</p>
                <p className="text-2xl font-black text-orange-600 dark:text-orange-400">
                  {stats.currentStreak} {stats.currentStreak === 1 ? 'Day' : 'Days'}
                </p>
              </div>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm font-bold text-gray-500 dark:text-gray-400">
                <span>{xpInLevel.toLocaleString()} XP</span>
                <span>{xpRequired.toLocaleString()} XP to Level {stats.level + 1}</span>
            </div>
            <div className="relative h-4 bg-gray-100 dark:bg-gray-900/50 rounded-full overflow-hidden shadow-inner">
              <div
                className="absolute top-0 left-0 h-full bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${xpProgress}%` }}
              >
                 <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </div>
            </div>
            {stats.currentStreak === 0 && (
               <p className="text-xs font-medium text-gray-400 mt-2 flex items-center gap-2">
                 <Zap size={14} className="text-yellow-500 fill-yellow-500" /> Start your first practice session today to begin your streak!
               </p>
            )}
          </div>
        </div>

        {/* Daily Challenge */}
        <div className="mb-10">
          <div className="relative bg-linear-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-3xl shadow-xl overflow-hidden group transform hover:scale-[1.01] transition-all duration-300">
            {/* Decorative Background Elements */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-white rounded-full blur-3xl group-hover:blur-[100px] transition-all duration-1000" />
              <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-indigo-400 rounded-full blur-3xl group-hover:blur-[100px] transition-all duration-1000" />
            </div>

            {/* Trophy Icon */}
            <div className="absolute top-8 right-8 text-white/10 rotate-12 transform group-hover:rotate-0 group-hover:scale-110 transition-all duration-700">
               <Trophy size={180} />
            </div>

            <div className="relative p-8 md:p-10">
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <div className="px-4 py-2 bg-white/20 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                     <Star size={12} className="fill-white" /> Daily Challenge
                  </span>
                </div>
                <div className="px-4 py-2 bg-black/20 backdrop-blur-md rounded-2xl border border-white/5">
                  <span className="text-xs font-medium text-white/90">
                    ⏰ Resets in {isMounted ? (resetTime || "--") : "--"}
                  </span>
                </div>
              </div>

              <h2 className="text-3xl md:text-4xl font-black text-white mb-3 tracking-tight">{dailyChallenge.title}</h2>
              <p className="text-lg text-indigo-50 mb-2 max-w-xl font-medium">{dailyChallenge.description}</p>
              <div className="flex items-center gap-4 mb-8">
                <div className="px-6 py-4 bg-indigo-900/40 rounded-2xl border border-indigo-500/20 backdrop-blur-sm h-full flex items-center">
                  <span className="text-sm text-indigo-100 font-medium mr-2">Reward:</span>
                  <span className="text-base font-bold text-white uppercase tracking-wide">{dailyChallenge.reward} XP</span>
                </div>
                
                {!dailyChallenge.completed && (
                   <button 
                    onClick={() => handleGameLaunch('daily-challenge')}
                    className="px-8 py-4 bg-white text-indigo-600 font-black rounded-2xl shadow-xl hover:shadow-2xl hover:bg-indigo-50 transform hover:-translate-y-1 transition-all duration-200 flex items-center gap-2"
                   >
                     {dailyChallenge.progress > 0 ? 'Continue Challenge' : 'Start Challenge'}
                     <div className="flex items-center gap-1 ml-2 px-2 py-1 bg-emerald-50 rounded-lg border border-emerald-100">
                        <span className="text-[10px] text-emerald-600 uppercase tracking-tighter">🌱 +10 Garden Health</span>
                     </div>
                   </button>
                )}
              </div>

              {/* Progress Section */}
              {dailyChallenge.progress > 0 && !dailyChallenge.completed && (
                <div className="bg-black/20 backdrop-blur-md rounded-2xl p-5 mb-8 max-w-lg border border-white/10">
                  <div className="flex items-center justify-between text-white text-sm font-bold mb-3">
                    <span>Your Progress</span>
                    <span>{dailyChallenge.progress}/{dailyChallenge.total} completed</span>
                  </div>
                  <div className="relative h-3 bg-black/20 rounded-full overflow-hidden">
                    <div
                      className="absolute top-0 left-0 h-full bg-white rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                      style={{ width: `${(dailyChallenge.progress / dailyChallenge.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {dailyChallenge.completed && (
                <div className="inline-flex items-center gap-3 px-8 py-4 bg-green-500/20 backdrop-blur-md rounded-2xl border border-green-500/30 text-green-100 font-bold text-lg">
                  <span className="text-2xl">✅</span>
                  Challenge Complete!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Game Modes Section */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                <Zap size={24} className="fill-indigo-600 dark:fill-indigo-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Game Modes</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gameModes.map((mode) => (
              <div
                key={mode.id}
                className="group bg-white dark:bg-[#1f2937] rounded-3xl shadow-sm dark:shadow-[0_0_25px_-5px_rgba(var(--glow-rgb),0.2)] border border-slate-200 dark:border-slate-800 p-8 hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-xl dark:hover:shadow-[0_0_50px_-10px_rgba(var(--glow-rgb),0.5)] transition-all duration-300 cursor-pointer transform hover:-translate-y-1 relative overflow-hidden"
                onClick={() => handleGameLaunch(mode.id)}
                style={{ '--glow-rgb': hexToRgb(mode.iconColor) } as React.CSSProperties}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 dark:bg-gray-800/50 rounded-bl-[100px] -mr-8 -mt-8 transition-colors group-hover:bg-indigo-50/50 dark:group-hover:bg-indigo-500/10" />
                
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-6 relative z-10 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-sm bg-opacity-10"
                  style={{ backgroundColor: `${mode.iconColor}15`, color: mode.iconColor }}
                >
                  {mode.icon}
                </div>

                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 relative z-10">{mode.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2 font-medium relative z-10">{mode.description}</p>
                
                <div className="flex items-center gap-2 mb-6 relative z-10">
                  <div className="px-3 py-1 bg-emerald-100 dark:bg-emerald-500/10 rounded-full border border-emerald-200/50 dark:border-emerald-500/20">
                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                      🌱 +5 Garden Health
                    </span>
                  </div>
                  <div className="px-3 py-1 bg-indigo-100 dark:bg-indigo-500/10 rounded-full border border-indigo-200/50 dark:border-indigo-500/20">
                    <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                      +20 XP
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-auto relative z-10 border-t border-gray-100 dark:border-gray-800 pt-6">
                  <div className="text-xs font-bold bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-lg text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Best: {
                        mode.id === 'face-match' ? stats.bestScores.faceMatch : 
                        mode.id === 'fact-match' ? stats.bestScores.factMatch : 
                        0
                    }
                  </div>
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm group-hover:gap-3 transition-all">
                    <span>Play</span>
                    <ArrowLeft className="rotate-180 w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats & Achievements Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Your Stats */}
          <div className="bg-white dark:bg-[#1f2937] rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-8">
            <div className="flex items-center gap-3 mb-8">
               <div className="p-2 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
                   <div className="text-xl">📊</div>
               </div>
               <h2 className="text-xl font-bold text-gray-900 dark:text-white">Your Stats</h2>
            </div>

            {stats.gamesPlayed === 0 ? (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border border-dashed border-gray-200 dark:border-slate-700">
                <div className="text-6xl mb-4 opacity-50">🎮</div>
                <p className="text-gray-900 dark:text-white font-bold mb-2">No games played yet</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">Start playing to track your stats and level up!</p>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">Total Games</span>
                  <span className="font-bold text-gray-900 dark:text-white text-lg">{stats.gamesPlayed}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">Total Score</span>
                  <span className="font-bold text-gray-900 dark:text-white text-lg">{stats.totalXP.toLocaleString()} pts</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">Best Streak</span>
                  <span className="font-bold text-orange-600 dark:text-orange-400 text-lg">🔥 {stats.currentStreak} days</span>
                </div>
              </div>
            )}

            <button className="w-full mt-8 px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              View Detailed Stats
            </button>
          </div>

          {/* Recent Achievements */}
          <div className="bg-white dark:bg-[#1f2937] rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-8">
            <div className="flex items-center gap-3 mb-8">
               <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 rounded-xl">
                   <div className="text-xl">🏆</div>
               </div>
               <h2 className="text-xl font-bold text-gray-900 dark:text-white">Achievements</h2>
            </div>

            <div className="space-y-4">
              {achievements.slice(0, 4).map((achievement) => (
                <div
                  key={achievement.id}
                  className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${
                    achievement.unlocked
                      ? 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-200/60 dark:border-amber-500/20'
                      : 'bg-gray-50 dark:bg-gray-800/50 border-transparent opacity-60 grayscale-[0.5]'
                  }`}
                >
                  <div className="text-3xl bg-white dark:bg-[#1f2937] p-2 rounded-xl shadow-sm">{achievement.icon}</div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1">{achievement.title}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed">{achievement.description}</p>
                    
                    {achievement.progress !== undefined && achievement.total && !achievement.unlocked && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-[10px] uppercase font-bold text-gray-400 mb-1">
                          <span>{achievement.progress}/{achievement.total}</span>
                          <span>{Math.round((achievement.progress / achievement.total) * 100)}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-linear-to-r from-amber-400 to-orange-400 rounded-full"
                            style={{ width: `${(achievement.progress / achievement.total) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  {achievement.unlocked && (
                    <div className="text-green-500 bg-green-100 dark:bg-green-900/20 rounded-full p-1">
                        <ArrowLeft className="rotate-180 w-3 h-3" strokeWidth={4} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button className="w-full mt-8 px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              View All Achievements
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-slate-400 text-sm font-medium pb-8 border-t border-slate-200 dark:border-slate-800 pt-8">
            <p className="mb-2">More game modes coming soon!</p>
            <p>ReMember Me • Practice & Gamification</p>
        </div>

    </main>
      
      <GameSetupModal
        isOpen={isSetupOpen}
        onClose={() => setIsSetupOpen(false)}
        onStart={handleStartGame}
        gameTitle={selectedGame?.title || 'Game'}
      />

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}
