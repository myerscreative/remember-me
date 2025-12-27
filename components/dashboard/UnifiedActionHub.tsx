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
                                mutualConnections: sortedMutuals.map(m => m.connected_person.name).slice(0, 3)
                            })
                        });
                        const scriptData = await scriptRes.json();
                        if (scriptData.script) setGeneratedScript(scriptData.script);
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
              note: note.trim() || undefined
          });

          // 3. Update 'The Story' if note exists (Per user request for unified persistence)
          if (note.trim()) {
              await updatePersonMemory(person.id, note.trim());
          }

          if (interactionResult.success) {
              toast.success("Connection Logged & Status Updated! 🌱");
              onAction(selectedType, note);
              setNote("");
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {/* High-Contrast Stage: Deep Navy + Blur XL */}
      <DialogContent showCloseButton={false} className="sm:max-w-[500px] bg-[#0F172A]/95 backdrop-blur-xl border border-indigo-500/30 shadow-[0_0_60px_-15px_rgba(99,102,241,0.3)] p-0 overflow-hidden gap-0 duration-300">
        <DialogTitle className="sr-only">Unified Action Hub for {person.name}</DialogTitle>
        
        {/* Header / Banner */}
        <div className="relative h-32 bg-gradient-to-r from-[#0F172A] via-[#1E1B4B] to-[#0F172A]">
             <div className="absolute top-0 left-0 w-full h-full bg-[url('/noise.png')] opacity-20 pointer-events-none mix-blend-overlay" />
             <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-transparent to-transparent" />
             
             <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-3 right-3 text-slate-400 hover:text-white hover:bg-white/10 z-10 rounded-full"
                onClick={onClose}
             >
                 <X className="h-5 w-5" />
             </Button>

             {/* Profile Avatar Stage */}
             <div className="absolute bottom-2 left-6 flex items-end gap-4 z-10">
                <Avatar className="h-20 w-20 border-4 border-[#0F172A] shadow-2xl ring-2 ring-indigo-500/30">
                    <AvatarImage src={person.photo_url || undefined} className="object-cover" />
                    <AvatarFallback className={cn("text-2xl text-white font-bold bg-slate-800")}>
                        {getInitials(person.first_name, person.last_name)}
                    </AvatarFallback>
                </Avatar>
                <div className="mb-2">
                    <h2 className="text-xl font-bold text-white tracking-tight leading-none drop-shadow-md">{person.name}</h2>
                    <div className="flex items-center gap-2 mt-1.5">
                         <Badge variant="outline" className={cn("uppercase text-[9px] tracking-widest font-bold px-1.5 py-0 border", statusColor, statusBorder, statusBg)}>
                            {person.relationship_value || 'Contact'} 
                        </Badge>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm border border-white/5">
                            <MapPin className="h-3 w-3" /> {(person as any).location || "San Diego, CA"}
                        </span>
                    </div>
                </div>
             </div>
        </div>

        {/* Actionable Script Box */}
        <div className="px-6 pb-2 relative z-20 -mt-2">
             <div className="relative overflow-hidden bg-gradient-to-br from-[#1E1B4B]/80 to-[#0F172A] border border-indigo-500/40 rounded-xl p-3 shadow-lg shadow-indigo-900/10 group">
                 <div className="absolute right-2 top-2">
                     <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-6 w-6 text-indigo-300 hover:text-white hover:bg-indigo-500/20 rounded-lg transition-all"
                        onClick={handleCopyScript}
                     >
                        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                     </Button>
                 </div>
                 
                 <div className="flex gap-2 mb-1.5">
                     <Sparkles className="h-3.5 w-3.5 text-indigo-300 mt-0.5" />
                     <p className="text-[10px] uppercase font-bold text-indigo-300 tracking-widest pt-0.5">Conversation Starter</p>
                 </div>
                 
                 <p className="text-sm text-slate-200 font-medium leading-relaxed italic pr-6 text-opacity-90">
                     {isGeneratingScript ? (
                         <span className="text-indigo-300/50 animate-pulse">Designing the perfect approach...</span>
                     ) : (
                         `"${generatedScript || "Hey, thinking of you! Hope all is well."}"`
                     )}
                 </p>
             </div>
        </div>

        {/* Deep Lore Sections (Compact) */}
        <ScrollArea className="px-6 h-[80px]">
            <div className="space-y-4 pb-2">
                <div className="space-y-1.5">
                    <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                        <Lightbulb className="h-3 w-3 text-amber-400" /> Contextual Updates
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                        {interests.slice(0, 5).map((interest: string, idx: number) => (
                            <span key={idx} className="cursor-pointer inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-white transition-all">
                                {interest}
                            </span>
                        ))}
                        {interests.length === 0 && <span className="text-[10px] text-slate-600 italic">No interests yet.</span>}
                    </div>
                </div>

                {/* Shared Connections */}
                {mutuals.length > 0 && (
                    <div className="space-y-1.5 animate-in fade-in slide-in-from-bottom-2 duration-300 delay-100">
                        <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                           Shared Connections
                        </h3>
                        <div className="flex items-center gap-1">
                             <div className="flex -space-x-2">
                                {mutuals.slice(0, 3).map((mutual) => (
                                    <Avatar 
                                      key={mutual.id} 
                                      className="h-6 w-6 border border-[#0F172A] cursor-pointer hover:z-10 hover:scale-110 transition-transform"
                                      onClick={() => {
                                         onClose();
                                         router.push(`/contacts/${mutual.connected_person.id}`);
                                      }}
                                    >
                                        <AvatarImage src={mutual.connected_person.photo_url || undefined} />
                                        <AvatarFallback className="text-[8px] bg-slate-700 text-slate-300">
                                            {getInitials(mutual.connected_person.first_name, mutual.connected_person.last_name)}
                                        </AvatarFallback>
                                    </Avatar>
                                ))}
                             </div>
                             <span className="text-[10px] text-slate-400 ml-2">
                                You both know {mutuals[0].connected_person.first_name} {mutuals.length > 1 && `+ ${mutuals.length - 1} others`}
                             </span>
                        </div>
                    </div>
                )}
            </div>
        </ScrollArea>

        {/* UNIFIED ACTION GRID & MEMORY LOG */}
        <div className="p-4 bg-[#0B1120] border-t border-slate-800 space-y-4 z-20 relative shadow-[0_-10px_40px_rgba(0,0,0,0.5)] min-h-[340px]">
             
             {/* Tab Switcher */}
             <div className="flex p-1 bg-slate-900/50 rounded-xl mb-4 border border-slate-800">
                <button
                    onClick={() => setActiveTab('log')}
                    className={cn(
                        "flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all",
                        activeTab === 'log' 
                            ? "bg-slate-800 text-white shadow-sm ring-1 ring-white/10" 
                            : "text-slate-500 hover:text-slate-300"
                    )}
                >
                    Log Action
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={cn(
                        "flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all",
                        activeTab === 'history' 
                            ? "bg-slate-800 text-white shadow-sm ring-1 ring-white/10" 
                            : "text-slate-500 hover:text-slate-300"
                    )}
                >
                    History
                </button>
             </div>

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
                              : "border-slate-800 bg-slate-900/50 hover:bg-slate-800 hover:border-slate-700"
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
                            className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900/50 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/50 focus:border-[#8B5CF6] resize-none transition-all text-sm"
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
                    <div className="bg-[#1E293B] border border-slate-700/50 rounded-xl p-3 shrink-0 relative overflow-hidden shadow-sm">
                        <div className="flex gap-3 items-start">
                             <div className="mt-0.5 bg-yellow-500/10 p-1 rounded-md">
                                {isGeneratingBrief ? (
                                    <Lightbulb className="h-4 w-4 text-yellow-500 animate-pulse" />
                                ) : (
                                    <Lightbulb className="h-4 w-4 text-yellow-500" />
                                )}
                             </div>
                             <div>
                                 <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Context Brief</h4>
                                 <p className="text-sm text-slate-200 font-medium leading-relaxed">
                                     {isGeneratingBrief ? (
                                         <span className="text-slate-500 italic animate-pulse">Connecting the dots...</span>
                                     ) : (
                                         contextBrief || "No sufficient context to generate brief."
                                     )}
                                 </p>
                             </div>
                        </div>
                    </div>
                    
                    {/* AI Status Banner */}
                    <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 border border-indigo-500/20 rounded-xl p-3 shrink-0 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-50" />
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
                                 <p className="text-sm text-slate-200 font-medium leading-relaxed">
                                     {isGeneratingStatus ? (
                                         <span className="text-slate-500 italic animate-pulse">Analyzing recent history...</span>
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

      </DialogContent>
    </Dialog>
  );
}
