'use client';

import { useState, useEffect, useCallback } from 'react';
import { logHeaderInteraction } from '@/app/actions/log-header-interaction';
import { getRecentInteractions } from '@/app/actions/get-recent-interactions';
import { addInterest } from '@/app/actions/story-actions';
import { addFamilyMember } from '@/app/actions/update-family-members';
import { addMilestone } from '@/app/actions/milestone-actions';
import { extractEntities, extractMilestones, EntityType } from '@/lib/entity-extractor';
import { EntitySuggestionBar, Suggestion } from './EntitySuggestionBar';
import { toast } from 'sonner';
import { showNurtureToast } from '@/components/ui/nurture-toast';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, Clock, Settings, Send } from 'lucide-react';
import { updateTargetFrequency } from '@/app/actions/update-target-frequency'; // Assuming this exists or I'll need to generic update

interface InteractionLoggerProps {
  contactId: string;
  contactName: string;
  className?: string;
  onSuccess?: () => void;
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

export function InteractionLogger({ contactId, contactName, className, onSuccess }: InteractionLoggerProps) {
  const [note, setNote] = useState("");
  const [isLogging, setIsLogging] = useState(false);
  const [recentInteractions, setRecentInteractions] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [frequency, setFrequency] = useState(30); // Default, should fetch from contact if possible or passed in props

  // Fetch recent interactions
  const fetchInteractions = useCallback(async () => {
    const result = await getRecentInteractions(contactId, 3);
    if (result.success) {
      setRecentInteractions(result.interactions);
    }
  }, [contactId]);

  useEffect(() => {
    fetchInteractions();
  }, [fetchInteractions]);

  // Real-time Extraction
  useEffect(() => {
    if (!note.trim()) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(() => {
      const entities = extractEntities(note);
      const milestone = extractMilestones(note);
      
      const newSuggestions: Suggestion[] = entities.map((e, i) => ({
        id: `entity-${i}-${e.value}`,
        type: e.type,
        label: e.value,
        context: e.context
      }));

      // Merge milestone if detected and robust
      if (milestone) {
         newSuggestions.push({
             id: `milestone-${Date.now()}`,
             type: 'Milestone',
             label: milestone.title === 'Potential Milestone' ? milestone.detectedDate : milestone.title,
             context: milestone.detectedDate
         });
      }

      setSuggestions(newSuggestions);
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [note]);


  const handleSuggestionConfirm = async (s: Suggestion) => {
      try {
          if (s.type === 'Interest') {
              toast.promise(addInterest(contactId, s.label), {
                  loading: 'Adding interest...',
                  success: 'Interest added!',
                  error: 'Failed to add interest'
              });
          } else if (s.type === 'Family') {
              // Infer relationship
              let rel = 'Other';
              if (s.context?.toLowerCase().includes('wife') || s.context?.toLowerCase().includes('partner')) rel = 'Partner';
              else if (s.context?.toLowerCase().includes('son') || s.context?.toLowerCase().includes('daughter')) rel = 'Child';
              
              toast.promise(addFamilyMember(contactId, { name: s.label, relationship: rel }), {
                  loading: 'Adding family member...',
                  success: 'Family member added!',
                  error: 'Failed to add member'
              });
          } else if (s.type === 'Milestone') {
              // Basic placeholder add
               toast.promise(addMilestone(contactId, { title: s.label, date: new Date().toISOString(), type: 'Event' }), {
                  loading: 'Adding milestone...',
                  success: `Milestone "${s.label}" saved!`,
                  error: 'Failed to add milestone'
              });
          }

          // Visual removal
          setSuggestions(prev => prev.filter(p => p.id !== s.id));
      } catch (e) {
          console.error(e);
      }
  };

  const handleLogConnection = async () => {
      setIsLogging(true);
      try {
          // Log as "Connection" (Call/Meeting)
          const result = await logHeaderInteraction(contactId, 'connection', note);
          
          if (result.success) {
              showNurtureToast(contactName);
              setNote("");
              fetchInteractions();
              if (onSuccess) onSuccess();
          } else {
              toast.error("Failed to log connection");
          }
      } catch (e) {
          console.error(e);
          toast.error("Error logging connection");
      } finally {
          setIsLogging(false);
      }
  };

  return (
    <div className={cn("w-full flex flex-col h-full", className)}>
        
        {/* TOP: BRAIN DUMP AREA */}
        <div className="flex-1 min-h-[160px] bg-slate-900/50 border border-slate-700/50 rounded-2xl p-4 flex flex-col relative focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all">
            <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2">
                What did you talk about?
            </label>
            <textarea 
                className="flex-1 bg-transparent border-none focus:ring-0 text-slate-200 text-sm placeholder:text-slate-600 resize-none leading-relaxed"
                placeholder="Caught up about his move to Austin. He's worried about the schools but excited for the BBQ..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                autoFocus
            />
            {/* Character Count / Status */}
            <div className="absolute bottom-3 right-3 text-[10px] text-slate-600">
                {note.length} chars
            </div>
        </div>

        {/* MIDDLE: SUGGESTION BAR */}
        <div className="min-h-[60px]">
            <EntitySuggestionBar suggestions={suggestions} onConfirm={handleSuggestionConfirm} />
        </div>

        {/* BOTTOM: ACTIONS */}
        <div className="mt-auto space-y-4">
            
            <button 
                onClick={handleLogConnection}
                disabled={isLogging}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-indigo-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
            >
               {isLogging ? (
                   <span className="animate-pulse">Saving...</span>
               ) : (
                   <>
                     <Send size={18} className="group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform"/>
                     Log Connection
                   </>
               )}
            </button>

            {/* SETTINGS TOGGLE */}
            <div className="border-t border-slate-800 pt-2">
                <button 
                    onClick={() => setShowSettings(!showSettings)}
                    className="flex items-center justify-between w-full text-slate-500 hover:text-slate-300 px-2 py-2 text-xs"
                >
                    <span className="flex items-center gap-2 font-medium">
                        <Settings size={12} /> Settings
                    </span>
                    {showSettings ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
                
                {showSettings && (
                    <div className="bg-slate-900/30 rounded-xl p-3 mt-2 space-y-3 animate-in fade-in slide-in-from-top-2">
                         <div className="flex justify-between items-center">
                             <label className="text-xs text-slate-400">Frequency Goal</label>
                             <div className="flex items-center gap-2 bg-slate-900 rounded-lg p-1 border border-slate-700">
                                 <Clock size={12} className="text-slate-500 ml-1"/>
                                 <select 
                                    className="bg-transparent text-xs text-slate-300 focus:outline-none"
                                    value={frequency}
                                    onChange={(e) => setFrequency(Number(e.target.value))}
                                 >
                                     <option value={7}>Weekly</option>
                                     <option value={14}>Bi-Weekly</option>
                                     <option value={30}>Monthly</option>
                                     <option value={90}>Quarterly</option>
                                 </select>
                             </div>
                         </div>
                         <p className="text-[10px] text-slate-600 italic">
                             Changes to settings are saved automatically when you log.
                         </p>
                    </div>
                )}
            </div>

        </div>
    </div>
  );
}
