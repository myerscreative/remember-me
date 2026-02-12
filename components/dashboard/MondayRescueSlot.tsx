
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Brain } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DriftRescue } from './DriftRescue';
import { getWeeklyRescues, DriftingContact } from '@/app/actions/drift-rescue-actions';

export function MondayRescueSlot() {
  const [rescues, setRescues] = useState<DriftingContact[]>([]);
  const [isMonday, setIsMonday] = useState(false);

  useEffect(() => {
    const checkMonday = () => {
      const now = new Date();
      // Only show on Mondays (1)
      setIsMonday(now.getDay() === 1);
    };
    
    checkMonday();
    fetchRescues();
  }, []);

  const fetchRescues = async () => {
    try {
      const data = await getWeeklyRescues();
      setRescues(data);
    } catch (e) {
      console.error(e);
    } finally {
      // Done loading
    }
  };

  if (!isMonday || rescues.length === 0) return null;

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      className="mb-8"
    >
      <Card className="relative overflow-hidden bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-950 border-indigo-500/30 shadow-2xl shadow-indigo-500/10">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Brain className="h-32 w-32 text-indigo-400 rotate-12" />
        </div>
        
        <div className="p-6 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="mt-1 p-3 bg-indigo-500/20 rounded-2xl border border-indigo-400/30 backdrop-blur-sm">
                <Calendar className="h-6 w-6 text-indigo-400" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Monday Morning Rescue</span>
                  <span className="px-1.5 py-0.5 bg-rose-500/20 text-rose-400 text-[8px] font-black rounded uppercase animate-pulse">At Risk</span>
                </div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight leading-none mb-2">
                  {rescues.length} HIGH-VALUE CONNECTIONS DRIFTING
                </h2>
                <p className="text-indigo-200/60 text-sm font-medium max-w-md">
                  We&apos;ve pre-calculated 5 high-resonance pings based on shared memories. Rescue your network pulse now.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <DriftRescue initialContacts={rescues} />
              <Button variant="ghost" className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 font-bold text-xs uppercase tracking-widest">
                Dismiss
              </Button>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {rescues.map((r) => (
              <div key={r.id} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                <span className="text-[10px] font-bold text-indigo-100/80 uppercase tracking-wider">{r.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Background Sparkles */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-4 left-1/4 w-1 h-1 bg-white rounded-full animate-ping opacity-20" />
          <div className="absolute bottom-10 right-1/3 w-1 h-1 bg-white rounded-full animate-ping opacity-10" />
        </div>
      </Card>
    </motion.div>
  );
}
