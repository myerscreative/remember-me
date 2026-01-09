'use client';

import { useState, useEffect } from 'react';
import { logHeaderInteraction } from '@/app/actions/log-header-interaction';
import { getRecentInteractions } from '@/app/actions/get-recent-interactions';
import { toast } from 'sonner';
import { showNurtureToast } from '@/components/ui/nurture-toast';
import { cn } from '@/lib/utils';

interface InteractionLoggerProps {
  contactId: string;
  contactName: string;
  className?: string;
}

// Helper function to format time ago
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function InteractionLogger({ contactId, contactName, className }: InteractionLoggerProps) {
  const [quickNote, setQuickNote] = useState("");
  const [isLogging, setIsLogging] = useState(false);
  const [recentInteractions, setRecentInteractions] = useState<any[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch recent interactions on mount and after logging
  useEffect(() => {
    const fetchInteractions = async () => {
      const result = await getRecentInteractions(contactId, 3);
      if (result.success) {
        setRecentInteractions(result.interactions);
      }
    };
    fetchInteractions();
  }, [contactId, refreshTrigger]);

  const handleLogInteraction = async (type: 'connection' | 'attempt') => {
      setIsLogging(true);
      try {
          const result = await logHeaderInteraction(contactId, type, quickNote);
          if (result.success) {
              // Show appropriate feedback based on action type
              if (type === 'connection') {
                  showNurtureToast(contactName);
              } else {
                  toast.success('Attempt logged');
              }
              setQuickNote(""); // Clear note
              // Trigger re-fetch of interactions
              setRefreshTrigger(prev => prev + 1);
          } else {
              toast.error('Failed to log interaction');
          }
      } catch (err) {
          console.error('Error in handleLogInteraction:', err);
          toast.error('Error logging interaction');
      } finally {
          setIsLogging(false);
      }
  };

  return (
    <div className={cn("w-full space-y-3", className)}>
        {/* Note Input */}
        <input 
            type="text" 
            placeholder="Add a quick note..." 
            value={quickNote}
            onChange={(e) => setQuickNote(e.target.value)}
            className="w-full bg-[#242642] border border-white/5 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
        />
        
        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
            <button 
                onClick={() => handleLogInteraction('attempt')}
                disabled={isLogging}
                className="flex items-center justify-center py-2.5 rounded-lg border border-orange-500/20 bg-orange-500/10 hover:bg-orange-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
                <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider">
                    {isLogging ? 'Saving...' : 'Log Attempt'}
                </span>
            </button>

            <button 
                onClick={() => handleLogInteraction('connection')}
                disabled={isLogging}
                className="flex items-center justify-center py-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
                    <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                    {isLogging ? 'Saving...' : 'Log Connection'}
                </span>
            </button>
        </div>

        {/* Recent Interactions */}
        <div className="mt-4 space-y-2">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Recent Activity ({recentInteractions.length})
            </h4>
            {recentInteractions.length === 0 ? (
            <p className="text-xs text-gray-500 italic">No interactions yet. Log one above!</p>
            ) : (
            recentInteractions.map((interaction: any) => {
                const date = new Date(interaction.interaction_date);
                const timeAgo = getTimeAgo(date);
                const isAttempt = interaction.notes?.includes('[Attempted Contact]');
                
                return (
                <div 
                    key={interaction.id} 
                    className="flex items-start gap-2 p-2 rounded-lg bg-[#1a1b2e] border border-white/5"
                >
                    <div className={cn(
                    "w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0",
                    isAttempt ? "bg-orange-400" : "bg-emerald-400"
                    )} />
                    <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-300 line-clamp-2">
                        {interaction.notes || 'No note'}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{timeAgo}</p>
                    </div>
                </div>
                );
            })
            )}
        </div>
    </div>
  );
}
