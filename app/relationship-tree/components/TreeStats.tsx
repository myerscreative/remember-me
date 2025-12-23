'use client';

import React from 'react';
import { TreeStats, HEALTH_COLORS, HEALTH_LABELS } from '../types';
import { getHealthScoreMessage } from '../utils/treeHealthUtils';

interface TreeStatsProps {
  stats: TreeStats;
  className?: string;
}

export default function TreeStatsPanel({ stats, className = '' }: TreeStatsProps) {
  const { message, emoji } = getHealthScoreMessage(stats.healthScore);
  
  // Calculate percentages for the progress bar
  const getPercentage = (value: number) => 
    stats.total > 0 ? Math.round((value / stats.total) * 100) : 0;

  return (
    <div className={`bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-lg p-5 ${className}`}>
      {/* Header with health score */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌳</span>
          <h3 className="text-lg font-semibold text-gray-800">Tree Health</h3>
        </div>
        
        {/* Health Score Circle */}
        <div className="relative w-14 h-14">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            {/* Background circle */}
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="3"
            />
            {/* Progress circle */}
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke={stats.healthScore >= 70 ? '#10b981' : stats.healthScore >= 40 ? '#f59e0b' : '#ef4444'}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${stats.healthScore} 100`}
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold text-gray-700">{stats.healthScore}</span>
          </div>
        </div>
      </div>
      
      {/* Health message */}
      <p className="text-sm text-gray-600 mb-4">
        {emoji} {message}
      </p>

      {/* Stacked bar visualization */}
      <div className="h-3 rounded-full overflow-hidden flex mb-4 bg-gray-100">
        {stats.healthy > 0 && (
          <div 
            className="transition-all duration-300"
            style={{ 
              width: `${getPercentage(stats.healthy)}%`,
              backgroundColor: HEALTH_COLORS.healthy 
            }}
          />
        )}
        {stats.warning > 0 && (
          <div 
            className="transition-all duration-300"
            style={{ 
              width: `${getPercentage(stats.warning)}%`,
              backgroundColor: HEALTH_COLORS.warning 
            }}
          />
        )}
        {stats.dying > 0 && (
          <div 
            className="transition-all duration-300"
            style={{ 
              width: `${getPercentage(stats.dying)}%`,
              backgroundColor: HEALTH_COLORS.dying 
            }}
          />
        )}
        {stats.dormant > 0 && (
          <div 
            className="transition-all duration-300"
            style={{ 
              width: `${getPercentage(stats.dormant)}%`,
              backgroundColor: HEALTH_COLORS.dormant 
            }}
          />
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-2">
        <StatItem 
          status="healthy" 
          count={stats.healthy} 
          percentage={getPercentage(stats.healthy)} 
        />
        <StatItem 
          status="warning" 
          count={stats.warning} 
          percentage={getPercentage(stats.warning)} 
        />
        <StatItem 
          status="dying" 
          count={stats.dying} 
          percentage={getPercentage(stats.dying)} 
        />
        <StatItem 
          status="dormant" 
          count={stats.dormant} 
          percentage={getPercentage(stats.dormant)} 
        />
      </div>

      {/* Total contacts */}
      <div className="mt-4 pt-4 border-t border-gray-100 text-center">
        <p className="text-sm text-gray-500">
          Total: <span className="font-semibold text-gray-700">{stats.total} contacts</span>
        </p>
      </div>
    </div>
  );
}

interface StatItemProps {
  status: keyof typeof HEALTH_COLORS;
  count: number;
  percentage: number;
}

function StatItem({ status, count, percentage }: StatItemProps) {
  const { label, emoji } = HEALTH_LABELS[status];
  
  return (
    <div className="text-center p-2 rounded-lg hover:bg-gray-50 transition-colors">
      <div 
        className="w-6 h-6 rounded-full mx-auto mb-1 flex items-center justify-center text-xs"
        style={{ backgroundColor: HEALTH_COLORS[status] }}
      >
        <span className="text-white font-semibold">{count}</span>
      </div>
      <p className="text-xs text-gray-500 truncate" title={label}>
        {emoji}
      </p>
      <p className="text-[10px] text-gray-400">{percentage}%</p>
    </div>
  );
}
