'use client';

import { Phone, Mail, MessageCircle, Users, Globe, Sparkles, Pin } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TimelineItem } from '@/lib/story/story-data';

interface StoryTimelineProps {
  items: TimelineItem[];
}

const interactionIcons: Record<string, typeof Phone> = {
  'call': Phone,
  'email': Mail,
  'text': MessageCircle,
  'in-person': Users,
  'social': Globe,
  'other': Sparkles,
};

const interactionColors: Record<string, string> = {
  'call': 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  'email': 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  'text': 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  'in-person': 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  'social': 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
  'other': 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}

export function StoryTimeline({ items }: StoryTimelineProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 dark:bg-[#252931] rounded-2xl border border-dashed border-gray-200 dark:border-[#3a3f4b]">
        <Sparkles className="h-8 w-8 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-400 mb-1">No story entries yet</p>
        <p className="text-gray-300 text-sm">
          Log an interaction or add a fact to start the story
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-6 top-0 bottom-0 w-px bg-linear-to-b from-indigo-200 via-gray-200 to-transparent dark:from-indigo-800 dark:via-gray-700" />

      <div className="space-y-6">
        {items.map((item) => (
          <div key={item.id} className="relative flex gap-4">
            {/* Timeline dot/icon */}
            <div className="relative z-10 shrink-0">
              {item.type === 'interaction' ? (
                <div className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center shadow-sm',
                  interactionColors[item.interactionType || 'other']
                )}>
                  {(() => {
                    const Icon = interactionIcons[item.interactionType || 'other'] || Sparkles;
                    return <Icon className="w-5 h-5" />;
                  })()}
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shadow-sm">
                  <Pin className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pb-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {item.content}
                </span>
                <span className="text-xs text-gray-400">
                  {formatDate(item.date)}
                </span>
              </div>

              {/* Note blockquote for interactions */}
              {item.note && (
                <blockquote className="mt-2 pl-4 border-l-2 border-indigo-200 dark:border-indigo-800 italic text-gray-600 dark:text-gray-400 font-serif text-sm">
                  &ldquo;{item.note}&rdquo;
                </blockquote>
              )}

              {/* Category badge for facts */}
              {item.type === 'fact' && item.category && (
                <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">
                  {item.category}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
