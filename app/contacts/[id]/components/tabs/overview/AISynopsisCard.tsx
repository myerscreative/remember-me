'use client';

import { Sparkles, ArrowRight, Calendar, MapPin, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useState } from 'react';

interface AISynopsisCardProps {
  contactId: string;
  contactName: string;
  deepLore?: string | null;
  whereMet?: string | null;
  aiSummary?: string | null;
  lastUpdated?: string;
  onNavigateToStory?: () => void;
  isInline?: boolean; // Added prop for new layout flexibility
}

export function AISynopsisCard({
  contactId,
  contactName,
  deepLore,
  whereMet,
  aiSummary,
  lastUpdated,
  onNavigateToStory,
  isInline = false
}: AISynopsisCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasContent = !!(aiSummary || deepLore || whereMet);

  // If "isInline" is true, we render a version suitable for the new card layout
  // But for now, let's keep it simple and just reuse the structure since the mock styling is handled by the parent container in OverviewPanel mostly.
  // We'll just ensure it fills the space correctly.

  if (!hasContent) {
    if (isInline) return null; // Let the parent handle the empty state for inline
    return (
      <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-2xl p-6 border border-indigo-500/20">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-indigo-500/20 rounded-xl">
            <Sparkles className="w-6 h-6 text-indigo-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-indigo-300 mb-1">
              Start Your Story with {contactName}
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Add details about how you met and your shared history to generate an AI summary.
            </p>
            <Button 
                onClick={onNavigateToStory}
                size="sm" 
                className="bg-indigo-600 hover:bg-indigo-700 text-white border-0"
            >
              Go to Story <ArrowRight className="w-3 h-3 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", !isInline && "bg-card border border-border rounded-2xl p-5 shadow-sm")}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">AI Summary</span>
        </div>
        {!isInline && (
            <span className="text-[10px] text-gray-500 bg-secondary/50 px-2 py-0.5 rounded-full">
            Beta
            </span>
        )}
        <button 
            onClick={onNavigateToStory}
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
        >
            View Full Story <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      <div className="space-y-3">
        {aiSummary ? (
            <div className="prose prose-invert prose-sm max-w-none">
                <div className="text-[13px] md:text-sm text-gray-300 leading-relaxed">
                    {isExpanded ? aiSummary : (aiSummary.length > 500 ? aiSummary.slice(0, 500) + '...' : aiSummary)}
                    {aiSummary.length > 500 && (
                        <button 
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="ml-1 text-[#60a5fa] hover:text-[#93c5fd] font-medium text-xs bg-transparent border-none cursor-pointer inline-flex items-center gap-0.5"
                        >
                            {isExpanded ? 'Show less' : 'Read more'}
                        </button>
                    )}
                </div>
            </div>
        ) : (
            <div className="space-y-2">
                {whereMet && (
                    <div className="flex gap-2 text-sm">
                        <span className="text-gray-500 font-medium">Met:</span>
                        <span className="text-gray-300">{whereMet}</span>
                    </div>
                )}
                {deepLore && (
                    <div className="bg-secondary/30 rounded-lg p-3 text-sm text-gray-300 italic border border-white/5">
                        "{deepLore}"
                    </div>
                )}
            </div>
        )}
      </div>

      <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500">
         <span>
            {lastUpdated ? `Updated ${new Date(lastUpdated).toLocaleDateString()}` : 'Recently updated'}
         </span>
         <div className="flex gap-1">
            {whereMet && (
                <span className="bg-[#2d3748] px-2 py-1 rounded-[6px] flex items-center gap-1 text-[#94a3b8]">
                    <MapPin className="w-3 h-3" /> {whereMet.split(' ')[0]}...
                </span>
            )}
         </div>
      </div>
    </div>
  );
}
