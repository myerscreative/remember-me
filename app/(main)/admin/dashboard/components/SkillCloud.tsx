'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface SkillCloudProps {
  skills: { name: string; count: number }[];
}

export default function SkillCloud({ skills }: SkillCloudProps) {
  const maxCount = Math.max(...skills.map(s => s.count), 1);

  return (
    <div className="flex flex-col p-6 bg-slate-800 rounded-2xl border border-slate-700/50 shadow-xl">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-white">Anonymized Skill Heatmap</h3>
        <p className="text-xs text-slate-400">Most common tags and interests across the community</p>
      </div>

      <div className="space-y-4">
        {skills.map((skill, index) => (
          <div key={skill.name} className="group cursor-pointer">
            <div className="flex justify-between items-end mb-1.5 px-1">
              <span className="text-sm font-semibold text-slate-200 group-hover:text-emerald-400 transition-colors">
                {skill.name}
              </span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                {skill.count} People
              </span>
            </div>
            <div className="h-2 w-full bg-slate-700/50 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(skill.count / maxCount) * 100}%` }}
                transition={{ duration: 1, delay: index * 0.1, ease: "easeOut" }}
                className="h-full bg-linear-to-r from-emerald-500/20 to-emerald-500 rounded-full relative"
              >
                <div className="absolute top-0 right-0 h-full w-4 bg-emerald-400 blur-sm opacity-50" />
              </motion.div>
            </div>
          </div>
        ))}

        {skills.length === 0 && (
          <div className="py-12 flex flex-col items-center justify-center text-center opacity-50">
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-600 mb-3" />
            <p className="text-xs font-medium text-slate-500">No skill data available yet</p>
          </div>
        )}
      </div>
      
      <p className="mt-8 text-[10px] text-slate-500 italic text-center">
        Click a skill to see density without exposing individual profiles.
      </p>
    </div>
  );
}
