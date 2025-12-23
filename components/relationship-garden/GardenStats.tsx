
import React from 'react';

interface GardenStatsProps {
  stats: {
    healthy: number;
    good: number;
    warning: number;
    dying: number;
  };
}

export default function GardenStats({ stats }: GardenStatsProps) {
  const statItems = [
    { label: 'Healthy', value: stats.healthy, color: '#10b981' },
    { label: 'Good', value: stats.good, color: '#84cc16' },
    { label: 'Warning', value: stats.warning, color: '#fbbf24' },
    { label: 'Dying', value: stats.dying, color: '#f97316' },
  ];

  return (
    <div className="flex flex-wrap justify-center gap-8 pt-6 border-t border-slate-200 mt-8">
      {statItems.map((item) => (
        <div key={item.label} className="text-center">
          <div className="text-3xl font-bold text-slate-900 mb-1">
            {item.value}
          </div>
          <div className="flex items-center justify-center gap-1.5 text-sm font-medium text-slate-500">
            <span 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}
