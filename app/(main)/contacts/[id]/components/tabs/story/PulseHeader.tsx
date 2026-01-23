'use client';

import { getDetailedRelationshipHealth as getRelationshipHealth, type HealthStatus } from '@/lib/relationship-health';
import { Flower2, Leaf, Droplets, CloudSun } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PulseHeaderProps {
  lastContactDate: string | Date | null;
  targetDays?: number;
}

const statusConfig: Record<HealthStatus, {
  label: string;
  description: string;
  icon: typeof Flower2;
  bgClass: string;
  textClass: string;
  borderClass: string;
}> = {
  nurtured: {
    label: 'Nurtured',
    description: 'Your connection is thriving',
    icon: Leaf,
    bgClass: 'bg-green-50 dark:bg-green-950/30',
    textClass: 'text-green-600 dark:text-green-400',
    borderClass: 'border-green-200 dark:border-green-800',
  },
  drifting: {
    label: 'Drifting',
    description: 'Could use some attention',
    icon: CloudSun,
    bgClass: 'bg-orange-50 dark:bg-orange-950/30',
    textClass: 'text-orange-600 dark:text-orange-400',
    borderClass: 'border-orange-200 dark:border-orange-800',
  },
  neglected: {
    label: 'Neglected',
    description: 'Time to reconnect',
    icon: Droplets,
    bgClass: 'bg-red-50 dark:bg-red-950/30',
    textClass: 'text-red-600 dark:text-red-400',
    borderClass: 'border-red-200 dark:border-red-800',
  },
};

function formatDaysSince(days: number): string {
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
  }
  if (days < 365) {
    const months = Math.floor(days / 30);
    return months === 1 ? '1 month ago' : `${months} months ago`;
  }
  const years = Math.floor(days / 365);
  return years === 1 ? 'Over a year ago' : `Over ${years} years ago`;
}

export function PulseHeader({ lastContactDate, targetDays = 30 }: PulseHeaderProps) {
  const health = getRelationshipHealth(lastContactDate, targetDays);
  const config = statusConfig[health.status];
  const Icon = config.icon;

  return (
    <div className={cn(
      'rounded-2xl border p-6 mb-6 transition-all',
      config.bgClass,
      config.borderClass
    )}>
      <div className="flex items-center gap-4">
        <div className={cn(
          'w-14 h-14 rounded-full flex items-center justify-center',
          'bg-white dark:bg-gray-900 shadow-sm'
        )}>
          <Icon className={cn('w-7 h-7', config.textClass)} />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn('text-lg font-semibold', config.textClass)}>
              {config.label}
            </span>
            <span className="text-gray-400 dark:text-gray-500">•</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {health.daysSince === 999 
                ? 'Never contacted' 
                : `Last spoke ${formatDaysSince(health.daysSince)}`}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {config.description}
          </p>
        </div>
      </div>
    </div>
  );
}
