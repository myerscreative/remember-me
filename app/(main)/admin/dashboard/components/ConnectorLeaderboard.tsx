'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, ArrowUpRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ConnectorLeaderboardProps {
  connectors: {
    name: string;
    avatar: string | null;
    referrals: number;
  }[];
}

export default function ConnectorLeaderboard({ connectors }: ConnectorLeaderboardProps) {
  return (
    <div className="flex flex-col p-6 bg-slate-800 rounded-2xl border border-slate-700/50 shadow-xl mt-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-500/10 rounded-lg">
            <Trophy className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Top Connectors</h3>
            <p className="text-xs text-slate-400">People driving the most approved referrals</p>
          </div>
        </div>
        <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-white transition-colors flex items-center gap-1">
          Full Rankings <ArrowUpRight className="h-3 w-3" />
        </button>
      </div>

      <div className="space-y-4">
        {connectors.map((person, index) => (
          <motion.div
            key={person.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-10 w-10 border-2 border-slate-700 group-hover:border-emerald-500/50 transition-colors">
                  <AvatarImage src={person.avatar || undefined} />
                  <AvatarFallback className="bg-slate-700 text-slate-200 text-xs font-bold">
                    {person.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className={`absolute -top-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shadow-lg
                  ${index === 0 ? 'bg-amber-500 text-white' : 
                    index === 1 ? 'bg-slate-400 text-white' : 
                    index === 2 ? 'bg-orange-600 text-white' : 'bg-slate-700 text-slate-400 border border-slate-600'}`}>
                  {index + 1}
                </div>
              </div>
              <div>
                <div className="text-sm font-bold text-slate-200">{person.name}</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Master Fabricator</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-black text-emerald-400">{person.referrals}</div>
              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Approved</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
