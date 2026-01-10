'use client';

import { Clock, MessageSquare, Calendar } from 'lucide-react';

interface QuickStatsCardProps {
  lastContactDate?: string | null;
  totalInteractions: number;
  nextContactDate?: string | null;
}

export function QuickStatsCard({
  lastContactDate,
  totalInteractions,
  nextContactDate
}: QuickStatsCardProps) {
  
  const formatLastContact = (dateStr?: string | null) => {
    if (!dateStr) return 'Never';
    
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const formatNextReminder = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `${diffDays} days`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks`;
    return `${Math.floor(diffDays / 30)} months`;
  };

  return (
    <section className="bg-card border border-border rounded-2xl p-5 shadow-sm">
      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">
        Quick Stats
      </h3>
      
      <div className="space-y-3">
        {/* Last Contact */}
        <div className="flex items-center justify-between py-2.5 border-b border-border">
          <span className="text-sm text-muted-foreground">Last Contact</span>
          <span className="text-sm font-semibold text-foreground">
            {formatLastContact(lastContactDate)}
          </span>
        </div>

        {/* Total Interactions */}
        <div className="flex items-center justify-between py-2.5 border-b border-border">
          <span className="text-sm text-muted-foreground">Total Interactions</span>
          <span className="text-sm font-semibold text-foreground">
            {totalInteractions}
          </span>
        </div>

        {/* Next Reminder */}
        <div className="flex items-center justify-between py-2.5">
          <span className="text-sm text-muted-foreground">Next Reminder</span>
          <span className="text-sm font-semibold text-foreground">
            {formatNextReminder(nextContactDate)}
          </span>
        </div>
      </div>
    </section>
  );
}
