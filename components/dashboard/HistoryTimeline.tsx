import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Copy, Phone, Mail, MessageSquare, Handshake, Share2, Sparkles } from "lucide-react"; // Added icons
import { formatDistanceToNow } from 'date-fns';
import { type InteractionHistoryItem } from "@/app/actions/get-interactions";
import { type InteractionType } from "@/lib/relationship-health";

interface HistoryTimelineProps {
  history: InteractionHistoryItem[];
  onCopy: (text: string) => void;
  isLoading: boolean;
}

const INTERACTION_ICONS: Record<InteractionType, React.ElementType> = {
    'call': Phone,
    'email': Mail,
    'text': MessageSquare,
    'in-person': Handshake,
    'social': Share2,
    'other': Sparkles
};

export function HistoryTimeline({ history, onCopy, isLoading }: HistoryTimelineProps) {
  if (isLoading) {
    return (
        <div className="flex flex-col items-center justify-center h-48 space-y-3 text-slate-500">
            <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            <span className="text-xs font-medium tracking-wide">Retrieving memory...</span>
        </div>
    );
  }

  if (history.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center h-48 text-slate-500 text-sm italic opacity-60">
            <Sparkles className="h-8 w-8 mb-2 opacity-20" />
            <p>No history found yet.</p>
            <p className="text-xs">Start your gardening! 🌱</p>
        </div>
    );
  }

  return (
    <div className="relative h-[300px] flex flex-col">
        {/* Fade Masks */}
        <div className="absolute top-0 left-0 right-0 h-4 bg-linear-to-b from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-4 bg-linear-to-t from-background to-transparent z-10 pointer-events-none" />

        <ScrollArea className="flex-1 -mx-2 px-2">
            <div className="space-y-4 py-2 pl-2 border-l-2 border-border ml-3">
                {history.map((item) => {
                    const Icon = INTERACTION_ICONS[item.type] || Sparkles;
                    const date = new Date(item.created_at);
                    const timeAgo = formatDistanceToNow(date, { addSuffix: true });
                    const displayDate = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

                    return (
                        <div key={item.id} className="relative pl-6 group">
                            {/* Timeline Dot */}
                            <div className="absolute -left-[21px] top-1 bg-background p-1 rounded-full border border-border group-hover:border-indigo-500 transition-colors">
                                <div className="w-2 h-2 bg-muted-foreground rounded-full group-hover:bg-indigo-500 transition-colors" />
                            </div>

                            {/* Card Content */}
                            <div className="bg-card border border-border rounded-xl p-3 hover:bg-accent hover:border-border transition-all">
                                <div className="flex items-start gap-3">
                                    <div className="bg-muted p-2 rounded-lg text-muted-foreground group-hover:text-indigo-400 group-hover:bg-indigo-500/10 transition-colors">
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-bold text-foreground uppercase tracking-wide">
                                                {item.type}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground font-mono" title={displayDate}>
                                                {timeAgo}
                                            </span>
                                        </div>
                                        
                                        {/* Next Goal Note Display */}
                                        {item.next_goal_note && item.next_goal_note.trim() !== "" && (
                                            <div className="mb-2 flex items-start gap-1.5">
                                                <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider shrink-0 mt-0.5">Strategy:</span>
                                                <span className="text-xs text-purple-400 font-medium italic">{item.next_goal_note}</span>
                                            </div>
                                        )}
                                        
                                        <div className="text-sm text-muted-foreground leading-snug break-words">
                                            {item.notes ? (
                                                <span className="text-foreground">{item.notes}</span>
                                            ) : (
                                                <span className="italic opacity-40 text-xs">No specific notes.</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action: Copy / Follow-up */}
                                    {item.notes && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 px-2 text-[10px] text-muted-foreground hover:text-indigo-300 hover:bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity gap-1.5"
                                            onClick={() => onCopy(item.notes!)}
                                        >
                                            <Copy className="h-3 w-3" />
                                            Follow-up
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </ScrollArea>
    </div>
  );
}
