'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface BridgeVelocityChartProps {
  data: {
    dates: string[];
    requests: number[];
    approvals: number[];
  };
}

export default function BridgeVelocityChart({ data }: BridgeVelocityChartProps) {
  const maxVal = Math.max(...data.requests, ...data.approvals, 1);
  const width = 400;
  const height = 200;
  const padding = 20;

  const getPoints = (vals: number[]) => {
    return vals.map((v, i) => {
      const x = (i / (vals.length - 1)) * (width - padding * 2) + padding;
      const y = height - ((v / maxVal) * (height - padding * 2) + padding);
      return `${x},${y}`;
    }).join(' ');
  };

  const requestPoints = getPoints(data.requests);
  const approvalPoints = getPoints(data.approvals);

  return (
    <div className="flex flex-col p-6 bg-slate-800 rounded-2xl border border-slate-700/50 shadow-xl w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-white">Bridge Velocity</h3>
          <p className="text-xs text-slate-400">Introduction requests vs. successful approvals</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-slate-500 rounded-full"></span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Requests</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-emerald-400 rounded-full"></span>
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Approvals</span>
          </div>
        </div>
      </div>

      <div className="relative w-full h-[200px]">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
            <line
              key={i}
              x1={padding}
              y1={padding + p * (height - padding * 2)}
              x2={width - padding}
              y2={padding + p * (height - padding * 2)}
              stroke="currentColor"
              className="text-slate-700/50"
              strokeDasharray="2,4"
            />
          ))}

          {/* Requests Line (Ghost) */}
          <motion.polyline
            points={requestPoints}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-slate-600"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.5 }}
            transition={{ duration: 2, delay: 0.5 }}
          />

          {/* Approvals Line (Solid) */}
          <motion.polyline
            points={approvalPoints}
            fill="none"
            stroke="#10b981"
            strokeWidth="3"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, delay: 0.7 }}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Points for Approvals */}
          {data.approvals.map((v, i) => {
             const x = (i / (data.approvals.length - 1)) * (width - padding * 2) + padding;
             const y = height - ((v / maxVal) * (height - padding * 2) + padding);
             return (
               <motion.circle
                 key={i}
                 cx={x}
                 cy={y}
                 r="3"
                 initial={{ scale: 0 }}
                 animate={{ scale: 1 }}
                 transition={{ delay: 1 + i * 0.05 }}
                 fill="#10b981"
               />
             );
          })}
        </svg>
      </div>
      
      <div className="flex justify-between mt-2 text-[10px] text-slate-500 font-bold px-5 uppercase tracking-tighter">
        <span>30 Days Ago</span>
        <span>Today</span>
      </div>
    </div>
  );
}
