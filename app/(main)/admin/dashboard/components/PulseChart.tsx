'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface PulseChartProps {
  score: number;
}

export default function PulseChart({ score }: PulseChartProps) {
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-slate-800 rounded-2xl border border-slate-700/50 shadow-xl">
      <div className="relative w-48 h-48">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="96"
            cy="96"
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth="12"
            className="text-slate-700"
          />
          <motion.circle
            cx="96"
            cy="96"
            r={radius}
            fill="transparent"
            stroke="url(#pulse-gradient)"
            strokeWidth="12"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 2, ease: "easeOut" }}
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="pulse-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" /> {/* indigo-500 */}
              <stop offset="100%" stopColor="#10b981" /> {/* emerald-500 */}
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <motion.span 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-4xl font-black text-white"
          >
            {Math.round(score)}%
          </motion.span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Community Pulse
          </span>
        </div>
      </div>
      <p className="mt-4 text-xs text-slate-400 text-center leading-relaxed max-w-[200px]">
        Overall percentage of <span className="text-emerald-400 font-bold">Nurtured</span> contacts across the group.
      </p>
    </div>
  );
}
