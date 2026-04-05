
import React from 'react';

interface GardenStatsProps {
  stats: {
    blooming: number;
    nourished: number;
    thirsty: number;
    fading: number;
  };
}

export default function GardenStats({ stats }: GardenStatsProps) {
  const statItems = [
    { label: 'Blooming', value: stats.blooming, color: '#22c55e' },
    { label: 'Nourished', value: stats.nourished, color: '#84cc16' },
    { label: 'Thirsty', value: stats.thirsty, color: '#eab308' },
    { label: 'Fading', value: stats.fading, color: '#f97316' },
  ];

  return (
    <div className="flex flex-wrap justify-center gap-8 pt-6 border-t border-border-default mt-8">
      {statItems.map((item) => (
        <div key={item.label} className="text-center">
          <div className="text-3xl font-bold text-text-primary mb-1">
            {item.value}
          </div>
          <div className="flex items-center justify-center gap-1.5 text-sm font-medium text-text-secondary">
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
