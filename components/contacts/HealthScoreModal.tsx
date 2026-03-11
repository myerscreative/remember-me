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
  score: number;
  trigger: React.ReactNode;
}

export function HealthScoreModal({ score, trigger }: HealthScoreModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="bg-slate-950 border-slate-800 text-slate-200 sm:max-w-[425px] p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            <Heart className="size-5 text-indigo-400" />
            About Relationship Health
          </DialogTitle>
        </DialogHeader>
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <p className="text-sm text-slate-400 leading-relaxed">
              {score === 0 ? (
                <span className="text-indigo-300 font-medium">A score of 0 means this &apos;Seed&apos; hasn&apos;t been nurtured yet. Use the Brain Dump or log a Shared Memory to boost it.</span>
              ) : (
                "This score shows how nurtured this connection is. It drifts lower over time if you don't stay in touch. Use the Brain Dump or log interactions to boost it!"
              )}
            </p>
            
            <div className="grid gap-3 pt-2">
               <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                 <div className="size-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                 <div className="flex flex-col">
                   <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Nurtured</span>
                   <span className="text-[10px] text-slate-500">Strong & Consistent</span>
                 </div>
                 <span className="text-[10px] text-slate-600 ml-auto font-mono">81-100</span>
               </div>
               <div className="flex items-center gap-3 p-3 rounded-xl bg-orange-500/5 border border-orange-500/10">
                 <div className="size-2 rounded-full bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.5)]" />
                 <div className="flex flex-col">
                   <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">Drifting</span>
                   <span className="text-[10px] text-slate-500">Needs Attention</span>
                 </div>
                 <span className="text-[10px] text-slate-600 ml-auto font-mono">41-80</span>
               </div>
               <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                 <div className="size-2 rounded-full bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)]" />
                 <div className="flex flex-col">
                   <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Neglected</span>
                   <span className="text-[10px] text-slate-500">Fading Seed</span>
                 </div>
                 <span className="text-[10px] text-slate-600 ml-auto font-mono">0-40</span>
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
