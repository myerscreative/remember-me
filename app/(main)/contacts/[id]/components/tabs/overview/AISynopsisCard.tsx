'use client';

import { Sparkles, ArrowRight, Calendar, MapPin, BookOpen, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useState } from 'react';
import { SummaryLevel } from '@/lib/utils/summary-levels';

interface AISynopsisCardProps {
  contactId: string;
  contactName: string;
  deepLore?: string | null;
  whereMet?: string | null;
  aiSummary?: string | null;
  summaryLevel?: SummaryLevel; // The effective summary level being displayed
  lastUpdated?: string;
  onNavigateToStory?: () => void;
  onRefresh?: () => void;
  isInline?: boolean; // Added prop for new layout flexibility
}

export function AISynopsisCard({
  contactId,
  contactName,
  deepLore,
  whereMet,
  aiSummary,
  summaryLevel = 'default',
  lastUpdated,
  onNavigateToStory,
  onRefresh,
  isInline = false
}: AISynopsisCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    await onRefresh();
    setIsRefreshing(false);
  };

  const hasContent = !!(aiSummary || deepLore || whereMet);

  // If "isInline" is true, we render a version suitable for the new card layout
  // But for now, let's keep it simple and just reuse the structure since the mock styling is handled by the parent container in OverviewPanel mostly.
  // We'll just ensure it fills the space correctly.

  if (!hasContent) {
    if (isInline) return (
      <div className="bg-[#1a1f2e] border border-[#2d3748] rounded-2xl p-4 md:px-6 md:py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-linear-to-br from-[#7c3aed] to-[#5b21b6] flex items-center justify-center text-lg shrink-0">
            ✨
          </div>
          <div className="flex-1">
            <p className="text-[13px] text-[#64748b] leading-relaxed">
              Add story details to generate an AI summary. 
              <button 
                  onClick={onNavigateToStory}
                  className="ml-1 text-[#7c3aed] font-medium cursor-pointer hover:underline bg-transparent border-none p-0 inline"
              >
                  Go to Story →
              </button>
            </p>
          </div>
        </div>
      </div>
    );
    return null;
  }

  const levelLabels = {
    micro: 'Quick',
    default: 'Standard',
    full: 'Detailed'
  };

  return (
    <div className={cn("bg-[#1a1f2e] border border-[#2d3748] rounded-2xl p-5 md:p-6", !isInline && "shadow-sm")}>
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2 text-[#94a3b8] text-[11px] font-semibold uppercase tracking-wider">
            <span>✨</span>
            <span>AI Summary</span>
            <span className="px-1.5 py-0.5 bg-[#2d3748] rounded text-[#7c3aed] text-[10px] font-medium">
              {levelLabels[summaryLevel]}
            </span>
        </div>
        <div className="flex items-center gap-2">
            <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="text-[12px] text-[#94a3b8] hover:text-[#60a5fa] font-medium flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh AI Summary"
            >
                <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
                onClick={onNavigateToStory}
                className="text-[12px] text-[#60a5fa] hover:text-[#93c5fd] font-medium flex items-center gap-1 transition-all"
            >
                View Full →
            </button>
        </div>
      </div>

      <div className="text-[14px] text-[#cbd5e1] leading-relaxed mb-3 md:mb-4 whitespace-pre-wrap">
        {aiSummary || deepLore}
      </div>

      <div className="pt-3 border-t border-[#2d3748] flex items-center justify-between flex-wrap gap-2">
         <span className="text-[11px] text-[#64748b]">
            {lastUpdated ? `Updated ${new Date(lastUpdated).toLocaleDateString()}` : 'Recently updated'}
         </span>
         <div className="flex gap-1.5 flex-wrap">
            {whereMet && (
                <span className="bg-[#2d3748] px-2 py-1 rounded-md text-[10px] text-[#94a3b8] flex items-center gap-1.5 uppercase tracking-wider font-semibold">
                    📍 {whereMet}
                </span>
            )}
         </div>
      </div>
    </div>
  );
}
