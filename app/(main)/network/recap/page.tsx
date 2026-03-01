'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWeeklyBloom } from '@/hooks/useWeeklyBloom';
import { Loader2, ArrowLeft, Leaf, Heart, Sparkles, TreePine } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

/**
 * WeeklyRecapPage
 * Displays the weekly "bloom" or "stagnant" recap for the user.
 * Automatically marks the recap as viewed when the page is loaded.
 */
export default function WeeklyRecapPage() {
  const { bloom, isLoading, markAsViewed } = useWeeklyBloom();
  const router = useRouter();

  // Mark as viewed when the user visits the page
  useEffect(() => {
    if (bloom && !bloom.is_viewed) {
      markAsViewed();
    }
  }, [bloom, markAsViewed]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0e1a]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
          <p className="text-emerald-500/50 font-medium animate-pulse">Growing your bloom...</p>
        </div>
      </div>
    );
  }

  const isStagnant = bloom?.status === 'stagnant' || !bloom;

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white p-6 md:p-12 overflow-y-auto scrollbar-hide">
      <div className="max-w-2xl mx-auto space-y-12 pb-24 md:pb-12">
        {/* Back Button */}
        <motion.button 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.push('/network')}
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group px-4 py-2 rounded-xl hover:bg-white/5"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back to Garden</span>
        </motion.button>

        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8 text-center"
        >
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 blur-3xl bg-emerald-500/30 rounded-full animate-pulse" />
              <div className="relative bg-zinc-900/80 p-8 rounded-[2.5rem] border border-white/5 shadow-2xl backdrop-blur-sm ring-1 ring-white/10">
                {isStagnant ? (
                    <Leaf size={64} className="text-zinc-500" />
                ) : (
                    <TreePine size={64} className="text-emerald-500" />
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight px-4">
              {isStagnant ? (
                <span className="text-zinc-300">Your Garden Missed You</span>
              ) : (
                <span className="bg-linear-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                  Your Weekly Bloom is Ready!
                </span>
              )}
            </h1>

            <p className="text-xl text-zinc-400 max-w-lg mx-auto leading-relaxed px-4">
              {isStagnant 
                ? "Take a moment to see who's drifting. A small interaction can keep a connection alive."
                : "See the connections you've nurtured this week and the memories you've grown."}
            </p>
          </div>
        </motion.div>

        {/* Highlight Card */}
        {!isStagnant && bloom?.highlight_contact && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-zinc-900/40 p-8 rounded-4xl border border-white/5 relative overflow-hidden group backdrop-blur-md shadow-xl"
          >
            <div className="absolute inset-0 bg-linear-to-br from-emerald-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10 text-center sm:text-left">
              <div className="bg-emerald-500/15 p-4 rounded-2xl ring-1 ring-emerald-500/20 shadow-inner">
                <Heart size={32} className="text-emerald-400 fill-emerald-400/20 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-xl text-white">New Memory Created</h3>
                <p className="text-emerald-400/90 text-lg">
                  You and <span className="font-bold text-white uppercase tracking-wider">{bloom.highlight_contact.name}</span> connected this week.
                </p>
              </div>
              <div className="sm:ml-auto">
                <Sparkles size={24} className="text-yellow-500/60 animate-pulse" />
              </div>
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col items-center gap-6 pt-4"
        >
            <Button 
              size="lg"
              onClick={() => router.push('/network')}
              className="bg-emerald-500 hover:bg-emerald-400 text-[#0a0e1a] rounded-full px-12 py-8 text-xl font-bold shadow-[0_0_40px_-10px_rgba(16,185,129,0.3)] transition-all hover:scale-105 active:scale-95 border-none"
            >
              {isStagnant ? "Explore Garden" : "See Your Progress"}
            </Button>
            
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium">
                Recaps refresh every Sunday at 9:00 AM
            </p>
        </motion.div>
      </div>
    </div>
  );
}
