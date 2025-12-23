"use client";

import { useState, useEffect } from "react";

export interface GameStats {
  totalXP: number;
  level: number;
  currentStreak: number;
  lastPlayedDate: string | null; // ISO string
  gamesPlayed: number;
  bestScores: {
    faceMatch: number;
    factMatch: number;
  };
}

const LEVEL_THRESHOLDS = [
  0,      // Level 1: Rookie
  500,    // Level 2: Apprentice
  1500,   // Level 3: Pro
  5000,   // Level 4: Expert
  15000,  // Level 5: Master
  50000   // Level 6: Grandmaster
];

export function useGameStats() {
  const [stats, setStats] = useState<GameStats>({
    totalXP: 0,
    level: 1,
    currentStreak: 0,
    lastPlayedDate: null,
    gamesPlayed: 0,
    bestScores: { faceMatch: 0, factMatch: 0 }
  });

  const [isLoaded, setIsLoaded] = useState(false);

  // Load from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem("remember-me-stats");
    if (saved) {
      try {
        setStats(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse game stats", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("remember-me-stats", JSON.stringify(stats));
    }
  }, [stats, isLoaded]);

  const addXP = (amount: number) => {
    setStats(prev => {
      const newXP = prev.totalXP + amount;
      
      // Calculate new level
      let newLevel = 1;
      for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
        if (newXP >= LEVEL_THRESHOLDS[i]) {
          newLevel = i + 1;
        }
      }

      return {
        ...prev,
        totalXP: newXP,
        level: newLevel
      };
    });
  };

  const recordGame = (mode: 'faceMatch' | 'factMatch', score: number) => {
    setStats(prev => {
      const today = new Date().toISOString().split('T')[0];
      const lastPlayed = prev.lastPlayedDate ? prev.lastPlayedDate.split('T')[0] : null;

      let newStreak = prev.currentStreak;
      
      if (today === lastPlayed) {
        // Already played today, maintain streak
      } else {
         const yesterday = new Date();
         yesterday.setDate(yesterday.getDate() - 1);
         const yesterdayStr = yesterday.toISOString().split('T')[0];

         if (lastPlayed === yesterdayStr) {
           newStreak += 1;
         } else {
           newStreak = 1; // Reset or Start streak
         }
      }

      return {
        ...prev,
        gamesPlayed: prev.gamesPlayed + 1,
        lastPlayedDate: new Date().toISOString(),
        currentStreak: newStreak,
        bestScores: {
          ...prev.bestScores,
          [mode]: Math.max(prev.bestScores[mode] || 0, score)
        }
      };
    });
    
    // Also add XP equal to score (simple mapping for now)
    addXP(score);
  };

  return {
    stats,
    isLoaded,
    addXP,
    recordGame
  };
}
