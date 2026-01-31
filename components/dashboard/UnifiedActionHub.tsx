"use client";

import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Lightbulb, MapPin, X, Sparkles, Copy, Check } from "lucide-react";
import { getInitials } from "@/lib/utils/contact-helpers";
import { cn } from "@/lib/utils";
import { Person } from "@/types/database.types";
import { updatePersonMemory } from "@/app/actions/update-person-memory";
import { logInteraction } from "@/app/actions/logInteraction";
import { getRecentInteractions, type InteractionHistoryItem } from "@/app/actions/get-interactions";
import { type InteractionType } from "@/lib/relationship-health";
import { getConnections, type ConnectionWithDetails } from "@/app/actions/get-connections";
import { HistoryTimeline } from "./HistoryTimeline";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

interface UnifiedActionHubProps {
  person: Person;
  isOpen: boolean;
  onClose: () => void;
  onAction: (actionType: InteractionType, note?: string) => void;
}

export function UnifiedActionHub({ person, isOpen, onClose, onAction, initialMethod }: UnifiedActionHubProps & { initialMethod?: InteractionType }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [nextGoal, setNextGoal] = useState(""); // New state for next goal
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Set default method
  const [selectedType, setSelectedType] = useState<InteractionType>('call');
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'log' | 'history'>('log');
  const [history, setHistory] = useState<InteractionHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [aiStatus, setAiStatus] = useState<string | null>(null);
  const [isGeneratingStatus, setIsGeneratingStatus] = useState(false);
  const [generatedScript, setGeneratedScript] = useState<string>("");
  const [goalUsed, setGoalUsed] = useState<string | null>(null); // Track if goal was used
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [contextBrief, setContextBrief] = useState<string | null>(null);
  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);
  const [mutuals, setMutuals] = useState<ConnectionWithDetails[]>([]);
  const [isLoadingMutuals, setIsLoadingMutuals] = useState(false);
  
  const noteInputRef = React.useRef<HTMLTextAreaElement>(null);

  // Sync initialMethod when modal opens
  React.useEffect(() => {
    if (isOpen && initialMethod) {
      setSelectedType(initialMethod);
      setActiveTab('log'); // Ensure we are on the log tab
      // Auto-focus note input
      setTimeout(() => {
        noteInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, initialMethod]);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // Default to today

  // ... (existing useEffects)

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);

      // 1. Optimistic UI update
      setOptimisticLastContact(new Date().toISOString());

      try {
          // 2. Log Interaction (Updates Last Contact & Blooming status)
          const interactionResult = await logInteraction({
              personId: person.id,
              type: selectedType,
              note: note.trim() || undefined,
              date: date ? new Date(date).toISOString() : undefined,
          });

          // 3. Update 'The Story' if note exists (Per user request for unified persistence)
          if (note.trim()) {
              await updatePersonMemory(person.id, note.trim());
          }

          if (interactionResult.success) {
              toast.success("Connection Logged & Status Updated! 🌱");
              onAction(selectedType, note);
              setNote("");
              setDate(new Date().toISOString().split('T')[0]); // Reset date
              setNextGoal(""); // Clear next goal
              setContextBrief(null); // Invalidate brief to force refresh with new context
              onClose();
          } else {
              toast.error("Failed to log interaction");
          }
      } catch {
          toast.error("Something went wrong");
      } finally {
          setIsSubmitting(false);
      }
  };

  // Fetch history & generate status/script on Open
  React.useEffect(() => {
    if (isOpen) {
       setIsLoadingHistory(true);
       getRecentInteractions(person.id)
         .then(async (res) => {
            if(res.success && res.data) {
                const logs = res.data;
                setHistory(logs);
                
                // 1. Fetch Mutuals (Parallel)
                setIsLoadingMutuals(true);
                const mutualsRes = await getConnections(person.id);
                const mutualsData = mutualsRes.success && mutualsRes.data ? mutualsRes.data : [];
                setMutuals(mutualsData);
                setIsLoadingMutuals(false);

                // Sort mutuals by health (recency)
                const sortedMutuals = [...mutualsData].sort((a, b) => {
                    const dateA = a.connected_person.last_interaction_date ? new Date(a.connected_person.last_interaction_date).getTime() : 0;
                    const dateB = b.connected_person.last_interaction_date ? new Date(b.connected_person.last_interaction_date).getTime() : 0;
                    return dateB - dateA;
                });

                // 2. Generate History Summary (Status)
                if (activeTab === 'history' && logs.length > 0 && !aiStatus) {
                    setIsGeneratingStatus(true);
                    try {
                        const statusRes = await fetch('/api/generate-status', {
                            method: 'POST',
                            body: JSON.stringify({ 
                                logs: logs.map(l => ({ 
                                    date: new Date(l.created_at).toLocaleDateString(), 
                                    type: l.type, 
                                    notes: l.notes 
                                })),
                                personName: person.name
                            })
                        });
                        const statusData = await statusRes.json();
                        if (statusData.status) setAiStatus(statusData.status);
                    } catch (e) {
                        console.error("Error generating AI status:", e);
                    } finally {
                        setIsGeneratingStatus(false);
                    }
                }

                // 3. Generate Conversation Starter (Script)
                // Only if not already generated, to save costs/time
                if (!generatedScript) {
                    // Extract latest Next Goal from history
                    const sortedLogs = [...logs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                    const latestNextGoal = sortedLogs.length > 0 ? sortedLogs[0].next_goal_note : null;

                    setIsGeneratingScript(true);
                    try {
                        const scriptRes = await fetch('/api/generate-script', {
                            method: 'POST',
                            body: JSON.stringify({
                                personName: person.name,
                                context: person.notes || `Interests: ${person.interests || person.what_found_interesting || "None"}`,
                                history: logs.map(l => ({ 
                                    date: new Date(l.created_at).toLocaleDateString(), 
                                    type: l.type, 
                                    notes: l.notes 
                                })).slice(0, 3), // Send last 3 for context
                                mutualConnections: sortedMutuals.map(m => m.connected_person.name).slice(0, 3),
                                nextGoal: latestNextGoal // Pass the goal
                            })
                        });
                        const scriptData = await scriptRes.json();
                        if (scriptData.script) {
                             setGeneratedScript(scriptData.script);
                             // Store effectively if we used a goal for UI labeling
                             if (latestNextGoal) setGoalUsed(latestNextGoal); 
                        }
                    } catch (e) {
                        console.error("Error generating script:", e);
                    } finally {
                        setIsGeneratingScript(false);
                    }
                }

                // 3. Generate Context Brief (New AI Summary)
                if (activeTab === 'history' && !contextBrief) {
                    setIsGeneratingBrief(true);
                    try {
                        const briefRes = await fetch('/api/generate-context-brief', {
                            method: 'POST',
                            body: JSON.stringify({
                                context: person.notes || `Interests: ${person.interests || person.what_found_interesting || "None"}`,
                                lastHistory: logs.length > 0 ? {
                                    date: new Date(logs[0].created_at).toLocaleDateString(),
                                    type: logs[0].type,
                                    notes: logs[0].notes
                                } : null
                            })
                        });
                        const briefData = await briefRes.json();
                        if (briefData.brief) setContextBrief(briefData.brief);
                    } catch (e) {
                        console.error("Error generating context brief:", e);
                    } finally {
                        setIsGeneratingBrief(false);
                    }
                }
            }
         })
         .finally(() => setIsLoadingHistory(false));
    }
  }, [isOpen, person.id, aiStatus, person.name, activeTab, generatedScript, person.notes, person.interests, person.what_found_interesting, contextBrief]);

  const handleCopyNote = (text: string) => {
      setNote(text);
      setActiveTab('log');
      toast.success("Note copied to input! 📝");
      setTimeout(() => noteInputRef.current?.focus(), 300);
  };
  
  // Optimistic State
  const [optimisticLastContact, setOptimisticLastContact] = useState<string | null>(person.last_interaction_date);

  // 1. SMART SCRIPT DYNAMICS
  const interests = React.useMemo(() => {
      return person.interests || (person.what_found_interesting ? person.what_found_interesting.split(',').map(s => s.trim()) : []);
  }, [person.interests, person.what_found_interesting]);
  




  // Determine Status Color with Optimistic Data
  const lastContactDate = optimisticLastContact ? new Date(optimisticLastContact) : null;
  const isFading = lastContactDate && lastContactDate < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  const statusColor = !lastContactDate ? "text-slate-400" : (isFading ? "text-orange-400" : "text-emerald-400");
  const statusBorder = !lastContactDate ? "border-slate-500/30" : (isFading ? "border-orange-500/30" : "border-emerald-500/30");
  const statusBg = !lastContactDate ? "bg-slate-500/10" : (isFading ? "bg-orange-500/10" : "bg-emerald-500/10");

  const handleCopyScript = () => {
      navigator.clipboard.writeText(generatedScript);
      setCopied(true);
      toast.success("Copied!");
      setTimeout(() => setCopied(false), 2000);
  };

  // Reordered for UI: Call, Email, Text (Row 1) - In Person, Social, Other (Row 2)
  const ORDERED_TYPES: InteractionType[] = ['call', 'email', 'text', 'in-person', 'social', 'other'];
  const INTERACTION_TYPES_MAP: Record<string, { label: string, emoji: string }> = {
      'call': { label: 'Phone Call', emoji: '📞' },
      'text': { label: 'Text/Message', emoji: '💬' },
      'email': { label: 'Email', emoji: '📧' },
      'in-person': { label: 'In Person', emoji: '🤝' },
      'social': { label: 'Social Media', emoji: '📱' },
      'other': { label: 'Other', emoji: '✨' }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border-border/50 text-foreground shadow-2xl overflow-hidden p-0 gap-0">
        <DialogTitle className="sr-only">Log Interaction with {person.name}</DialogTitle>
        
        {/* Header Section */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border/40 shrink-0 bg-background/50">
          <div className="flex items-center gap-3">
             <div className="relative">
                <Avatar className="h-10 w-10 border-2 border-white/10 shadow-sm">
                  <AvatarImage src={person.photo_url || undefined} alt={person.name} className="object-cover" />
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-medium text-sm">
                    {getInitials(person.name)}
                  </AvatarFallback>
                </Avatar>
                {/* Online Indicator (Optional) */}
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-background rounded-full"></div>
             </div>
             <div>
                <h2 className="text-lg font-bold text-foreground leading-tight">{person.name}</h2>
                <div className="flex items-center gap-2">
                   <Badge variant="outline" className={cn("text-[10px] uppercase tracking-wider h-5 px-1.5 font-bold border-white/10 bg-white/5", statusColor, statusBg, statusBorder)}>
                      {person.job_title || "Contact"}
                   </Badge>
                </div>
             </div>
          </div>
          
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>

        <div className="flex mx-6 mt-4 mb-2 bg-slate-100 dark:bg-slate-900/50 rounded-lg p-1 border border-border/40">
           <button
             onClick={() => setActiveTab('log')}
             className={cn(
               "flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all duration-200",
               activeTab === 'log' 
                 ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm" 
                 : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
             )}
           >
             <span className="text-base">✨</span> Log Action
           </button>
           <button
             onClick={() => setActiveTab('history')}
             className={cn(
               "flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all duration-200",
               activeTab === 'history' 
                 ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm" 
                 : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
             )}
           >
             <span className="text-base">📜</span> History
           </button>
        </div>

        <ScrollArea className="flex-1 max-h-[60vh]">
         <div className="p-6 pt-2">
             {activeTab === 'log' ? (
               <>
                 {/* 6-Tile Grid */}
                <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">
                    How did you connect?
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {ORDERED_TYPES.map((typeValue) => {
                      const typeInfo = INTERACTION_TYPES_MAP[typeValue];
                      const isActive = selectedType === typeValue;
                      
                      return (
                        <button
                          key={typeValue}
                          type="button"
                          onClick={() => setSelectedType(typeValue)}
                          className={cn(
                            "p-2 rounded-xl border transition-all duration-200 text-center flex flex-col items-center justify-center gap-1 h-16 relative group",
                            isActive 
                              ? "border-[#8B5CF6] bg-[#8B5CF6]/10 shadow-[0_0_15px_rgba(139,92,246,0.3)]" 
                              : "border-border bg-card hover:bg-accent hover:border-slate-400 dark:hover:border-slate-700"
                          )}
                        >
                          <span className="text-xl drop-shadow-sm transition-transform group-hover:scale-110 duration-200">{typeInfo.emoji}</span>
                          <span className={cn(
                            "text-[9px] font-bold uppercase tracking-tight",
                            isActive ? "text-[#8B5CF6]" : "text-slate-500 group-hover:text-slate-300"
                          )}>
                            {typeInfo.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                 {/* Date Picker */}
                 <div className="animate-in fade-in slide-in-from-left-4 duration-300 delay-50 mt-4">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">
                       When?
                    </label>
                    <input 
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/50 focus:border-[#8B5CF6] transition-all text-sm scheme-dark"
                    />
                 </div>

                 {/* Unified Story Input */}
                 <div className="animate-in fade-in slide-in-from-left-4 duration-300 delay-75">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">
                       Story / Notes <span className="text-slate-600 font-normal normal-case italic ml-1">(Optional)</span>
                    </label>
                    <div className="relative">
                        <textarea
                            ref={noteInputRef}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="What did you talk about? Add a specific detail..."
                            rows={2}
                            className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/50 focus:border-[#8B5CF6] resize-none transition-all text-sm"
                        />
                    </div>
                 </div>

                 {/* Next Goal Input (New) */}
                 <div className="animate-in fade-in slide-in-from-left-4 duration-300 delay-100 mb-4">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">
                       Goal for Next Contact <span className="text-indigo-400 font-normal normal-case italic ml-1">(Column 3 Strategy)</span>
                    </label>
                    <div className="relative">
                        <textarea
                            value={nextGoal}
                            onChange={(e) => setNextGoal(e.target.value)}
                            placeholder="e.g., Ask about their new project..."
                            rows={1}
                            className="w-full px-4 py-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5 text-foreground placeholder:text-indigo-400/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 resize-none transition-all text-sm"
                        />
                    </div>
                 </div>

                 {/* Complete Action Button */}
                 <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full h-12 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold tracking-wide rounded-xl shadow-lg shadow-purple-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 group relative overflow-hidden text-base animate-in fade-in slide-in-from-bottom-2 duration-300 delay-100"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                        <span>Logging...</span>
                      </>
                    ) : (
                      <>
                        <span className="relative z-10 flex items-center gap-2">
                           🌱 Log Connection
                        </span>
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                      </>
                    )}
                  </Button>
               </>
             ) : (
                <div className="space-y-4 h-[340px] overflow-hidden flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
                    
                    {/* Context Brief (AI Insight) */}
                    <div className="bg-card border border-border rounded-xl p-3 shrink-0 relative overflow-hidden shadow-sm">
                        <div className="flex gap-3 items-start">
                             <div className="mt-0.5 bg-yellow-500/10 p-1 rounded-md">
                                {isGeneratingBrief ? (
                                    <Lightbulb className="h-4 w-4 text-yellow-500 animate-pulse" />
                                ) : (
                                    <Lightbulb className="h-4 w-4 text-yellow-500" />
                                )}
                             </div>
                             <div>
                                 <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Context Brief</h4>
                                 <p className="text-sm text-foreground font-medium leading-relaxed">
                                     {isGeneratingBrief ? (
                                         <span className="text-muted-foreground italic animate-pulse">Connecting the dots...</span>
                                     ) : (
                                         contextBrief || "No sufficient context to generate brief."
                                     )}
                                 </p>
                             </div>
                        </div>
                    </div>
                    
                    {/* AI Status Banner */}
                    <div className="bg-linear-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 border border-indigo-500/20 rounded-xl p-3 shrink-0 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-50" />
                        <div className="flex gap-2">
                             <div className="mt-0.5">
                                {isGeneratingStatus ? (
                                    <Sparkles className="h-4 w-4 text-indigo-400 animate-pulse" />
                                ) : (
                                    <Sparkles className="h-4 w-4 text-indigo-400" />
                                )}
                             </div>
                             <div>
                                 <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">History Summary</h4>
                                 <p className="text-sm text-foreground font-medium leading-relaxed">
                                     {isGeneratingStatus ? (
                                         <span className="text-muted-foreground italic animate-pulse">Analyzing recent history...</span>
                                     ) : (
                                         aiStatus || "No recent history to summarize."
                                     )}
                                 </p>
                             </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between px-1 shrink-0">
                         <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Interaction Timeline</h4>
                    </div>
                    
                    <HistoryTimeline 
                        history={history} 
                        isLoading={isLoadingHistory} 
                        onCopy={handleCopyNote} 
                    />
                </div>
             )}
        </div>
        </ScrollArea>

      </DialogContent>
    </Dialog>
  );
}
