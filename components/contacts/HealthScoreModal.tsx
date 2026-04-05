'use client';

import React from 'react';
import { Heart } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';

interface HealthScoreModalProps {
  daysRemaining: number;
  cadenceDays: number;
  trigger: React.ReactNode;
}

export function HealthScoreModal({ daysRemaining, cadenceDays, trigger }: HealthScoreModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="bg-canvas border-border-default text-text-secondary sm:max-w-[425px] p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-bold text-text-primary flex items-center gap-2">
            <Heart className="size-5 text-indigo-400" />
            Days Until Next Contact
          </DialogTitle>
        </DialogHeader>
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <p className="text-sm text-text-tertiary leading-relaxed">
              {daysRemaining === 0 ? (
                <span className="text-indigo-300 font-medium">0 days left means it&apos;s time to reach out. Log an interaction or add a Shared Memory to reset the clock.</span>
              ) : (
                `You have ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} left before your next check-in (based on a ${cadenceDays}-day cadence). Log interactions to keep this connection nurtured!`
              )}
            </p>
            
            <div className="grid gap-3 pt-2">
               <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                 <div className="size-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                 <div className="flex flex-col">
                   <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Nurtured</span>
                   <span className="text-[10px] text-text-tertiary">More than 5 days until next contact</span>
                 </div>
                 <span className="text-[10px] text-text-secondary ml-auto font-mono">&gt;5 days</span>
               </div>
               <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                 <div className="size-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                 <div className="flex flex-col">
                   <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Due soon</span>
                   <span className="text-[10px] text-text-tertiary">1–5 days until next contact</span>
                 </div>
                 <span className="text-[10px] text-text-secondary ml-auto font-mono">1–5 days</span>
               </div>
               <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                 <div className="size-2 rounded-full bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)]" />
                 <div className="flex flex-col">
                   <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Overdue</span>
                   <span className="text-[10px] text-text-tertiary">Time to reach out</span>
                 </div>
                 <span className="text-[10px] text-text-secondary ml-auto font-mono">0 days</span>
               </div>
            </div>
          </div>

          <DialogClose asChild>
            <Button className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-900/40 transition-all active:scale-[0.98]">
              Got it
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
