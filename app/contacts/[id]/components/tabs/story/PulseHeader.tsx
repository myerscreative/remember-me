'use client';

import { getRelationshipHealth, type HealthStatus } from '@/lib/relationship-health';
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
  BLOOMING: {
    label: 'Blooming',
    description: 'Your connection is thriving',
    icon: Flower2,
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/30',
    textClass: 'text-emerald-600 dark:text-emerald-400',
    borderClass: 'border-emerald-200 dark:border-emerald-800',
  },
  NOURISHED: {
    label: 'Nourished',
    description: 'Connection is healthy',
    icon: Leaf,
    bgClass: 'bg-lime-50 dark:bg-lime-950/30',
    textClass: 'text-lime-600 dark:text-lime-400',
    borderClass: 'border-lime-200 dark:border-lime-800',
  },
  THIRSTY: {
    label: 'Thirsty',
    description: 'Could use some attention',
    icon: Droplets,
    bgClass: 'bg-amber-50 dark:bg-amber-950/30',
    textClass: 'text-amber-600 dark:text-amber-400',
    borderClass: 'border-amber-200 dark:border-amber-800',
  },
  FADING: {
    label: 'Fading',
    description: 'Time to reconnect',
    icon: CloudSun,
    bgClass: 'bg-orange-50 dark:bg-orange-950/30',
    textClass: 'text-orange-600 dark:text-orange-400',
    borderClass: 'border-orange-200 dark:border-orange-800',
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
