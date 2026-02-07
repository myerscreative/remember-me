'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { logHeaderInteraction } from '@/app/actions/log-header-interaction';
import { getRecentInteractions } from '@/app/actions/get-recent-interactions';
import { addInterest } from '@/app/actions/story-actions';
import { addFamilyMember } from '@/app/actions/update-family-members';
import { addMilestone } from '@/app/actions/milestone-actions';
import { extractEntities, extractMilestones } from '@/lib/entity-extractor';
import { EntitySuggestionBar, Suggestion } from './EntitySuggestionBar';
import { toast } from 'sonner';
import { showNurtureToast } from '@/components/ui/nurture-toast';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, Clock, Settings, Send, Mic, Square, Loader2, Calendar } from 'lucide-react';
import { scheduleNextContact } from '@/app/actions/schedule-next-contact';

import { getInitials } from '@/lib/utils/contact-helpers';

interface InteractionLoggerProps {
  contactId: string;
  contactName: string;
  photoUrl?: string; // New prop for Header
  healthStatus?: 'nurtured' | 'drifting' | 'neglected'; // New prop for Ring
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

export function InteractionLogger({ contactId, contactName, photoUrl, healthStatus = 'drifting', className, onSuccess }: InteractionLoggerProps) {
  const [note, setNote] = useState("");
  const [isLogging, setIsLogging] = useState(false);
  const [recentInteractions, setRecentInteractions] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [frequency, setFrequency] = useState(30); // Default, should fetch from contact if possible or passed in props

  // Next contact scheduling state
  const [showNextContact, setShowNextContact] = useState(false);
  const [nextContactDate, setNextContactDate] = useState("");
  const [nextContactReason, setNextContactReason] = useState("");

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Health Color Logic (Local map to avoid circular dep if mostly visual)
  const ringColor = healthStatus === 'nurtured' ? 'border-green-500' : (healthStatus === 'neglected' ? 'border-red-500' : 'border-orange-500');
  const ringShadow = healthStatus === 'nurtured' ? 'shadow-green-500/20' : (healthStatus === 'neglected' ? 'shadow-red-500/20' : 'shadow-orange-500/20');

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

  // Cleanup audio recording on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Format recording time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Start audio recording
  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error("Your browser does not support audio recording");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "audio/ogg"
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType
        });

        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }

        // Transcribe the audio
        await transcribeAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

    } catch (error) {
      console.error("Error starting recording:", error);
      if (error instanceof Error) {
        if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
          toast.error("Microphone permission denied. Please allow access and try again.");
        } else if (error.name === "NotFoundError") {
          toast.error("No microphone found. Please connect one and try again.");
        } else {
          toast.error(error.message || "Failed to start recording");
        }
      }
    }
  };

  // Stop audio recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  // Transcribe audio to text
  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Transcription failed");
      }

      const data = await response.json();
      if (data.transcript) {
        // Append transcribed text to existing note
        setNote((prev) => {
          const separator = prev.trim() ? " " : "";
          return prev + separator + data.transcript;
        });
        toast.success("Voice transcribed successfully");
      }
    } catch (error) {
      console.error("Transcription error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to transcribe audio");
    } finally {
      setIsTranscribing(false);
    }
  };

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
              // If next contact is scheduled, save it
              if (nextContactDate) {
                  const scheduleResult = await scheduleNextContact(
                      contactId,
                      nextContactDate,
                      nextContactReason || undefined
                  );
                  
                  if (!scheduleResult.success) {
                      toast.error(scheduleResult.error || 'Failed to schedule next contact');
                  } else {
                      toast.success('Next contact scheduled!');
                  }
              }
              
              showNurtureToast(contactName);
              setNote("");
              setNextContactDate("");
              setNextContactReason("");
              setShowNextContact(false);
              fetchInteractions();
              if (onSuccess) onSuccess();
          } else {
              // Display the actual error message from the server
              const errorMessage = result.error || "Failed to log connection";
              console.error("❌ Connection log failed:", {
                  error: result.error,
                  details: result.details,
                  contactId,
                  noteLength: note.length
              });
              toast.error(errorMessage);
          }
      } catch (e) {
          console.error("❌ Exception logging connection:", e);
          toast.error(`Error logging connection: ${e instanceof Error ? e.message : 'Unknown error'}`);
      } finally {
          setIsLogging(false);
      }
  };

  return (
    <div className={cn("w-full flex flex-col h-full", className)}>
        
        {/* HEADER: AVATAR + NAME + RING */}
        <div className="flex flex-col items-center mb-6">
             <div className={`w-16 h-16 rounded-full border-[3px] ${ringColor} p-1 shadow-lg ${ringShadow} mb-2`}>
                 {photoUrl ? (
                     <img src={photoUrl} alt={contactName} className="rounded-full w-full h-full object-cover" />
                 ) : (
                     <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center text-lg font-bold text-white">
                         {getInitials(contactName)}
                     </div>
                 )}
             </div>
             <h3 className="text-lg font-bold text-white leading-none">{contactName}</h3>
             <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-1 opacity-70">Log Connection</p>
        </div>

        {/* TOP: BRAIN DUMP AREA */}
        <div className="flex-1 min-h-[160px] bg-slate-900/50 border border-slate-700/50 rounded-2xl p-4 flex flex-col relative focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all shadow-inner">
            <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"/> What did you talk about?
                </label>
                {/* Audio Recording Button */}
                <button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isTranscribing}
                    className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                        isRecording
                            ? "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
                            : isTranscribing
                            ? "bg-slate-700/50 text-slate-500 cursor-wait"
                            : "bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-indigo-500/20 hover:text-indigo-300 hover:border-indigo-500/30"
                    )}
                >
                    {isTranscribing ? (
                        <>
                            <Loader2 size={12} className="animate-spin" />
                            <span>Transcribing...</span>
                        </>
                    ) : isRecording ? (
                        <>
                            <Square size={12} className="fill-current" />
                            <span>{formatTime(recordingTime)}</span>
                        </>
                    ) : (
                        <>
                            <Mic size={12} />
                            <span>Voice</span>
                        </>
                    )}
                </button>
            </div>
            <textarea
                className="flex-1 bg-transparent border-none focus:ring-0 text-slate-200 text-sm placeholder:text-slate-600 resize-none leading-relaxed selection:bg-indigo-500/30"
                placeholder="Caught up about his move to Austin. He's worried about the schools but excited for the BBQ..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                autoFocus
                disabled={isRecording}
            />
            {/* Recording indicator */}
            {isRecording && (
                <div className="absolute inset-0 rounded-2xl border-2 border-red-500/50 pointer-events-none animate-pulse" />
            )}
            {/* Character Count */}
            <div className="absolute bottom-3 right-3 text-[10px] text-slate-600 font-medium font-mono">
                {note.length}
            </div>
        </div>


        {/* MIDDLE: TYPE SELECTOR & SUGGESTIONS */}
        <div className="space-y-3 relative z-10">
            {/* Type Selector (Shrunk/Secondary) */}
            <div className="flex items-center justify-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
                {['Call', 'Text', 'Email', 'Review'].map((type) => (
                    <button 
                        key={type}
                        className="px-3 py-1.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-[10px] text-slate-400 hover:bg-indigo-500/20 hover:text-indigo-300 hover:border-indigo-500/30 transition-all uppercase tracking-wider font-medium"
                    >
                        {type}
                    </button>
                ))}
            </div>

            <EntitySuggestionBar suggestions={suggestions} onConfirm={handleSuggestionConfirm} />
        </div>

        {/* SCHEDULE NEXT CONTACT SECTION */}
        <div className="border-t border-slate-800 pt-3">
            <button 
                onClick={() => setShowNextContact(!showNextContact)}
                className="flex items-center gap-2 text-slate-400 hover:text-indigo-300 text-sm transition-colors w-full justify-between"
            >
                <div className="flex items-center gap-2">
                    <Calendar size={14} />
                    <span>Schedule Next Contact</span>
                </div>
                {showNextContact ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            
            {showNextContact && (
                <div className="mt-3 space-y-3 bg-slate-900/30 rounded-xl p-3 border border-white/5 animate-in fade-in slide-in-from-bottom-2">
                    <div>
                        <label className="text-xs text-slate-400 mb-1 block">When?</label>
                        <input 
                            type="date"
                            value={nextContactDate}
                            onChange={(e) => setNextContactDate(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                            min={new Date().toISOString().split('T')[0]}
                        />
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 mb-1 block">What for? (optional)</label>
                        <input 
                            type="text"
                            value={nextContactReason}
                            onChange={(e) => setNextContactReason(e.target.value)}
                            placeholder="e.g., Follow up on job search, Check in about project"
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                        />
                    </div>
                </div>
            )}
        </div>

        {/* BOTTOM: ACTIONS */}
        <div className="mt-auto space-y-4">
            
            <button 
                onClick={handleLogConnection}
                disabled={isLogging || !note.trim()}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-indigo-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
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

            {/* SETTINGS TOGGLE (HIDDEN AREA) */}
            <div className="border-t border-slate-800 pt-2 flex justify-center">
                <button 
                    onClick={() => setShowSettings(!showSettings)}
                    className="flex items-center gap-1 text-slate-600 hover:text-slate-400 px-2 py-2 text-[10px] uppercase font-bold tracking-widest transition-colors"
                >
                    <Settings size={10} /> Settings
                    {showSettings ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                </button>
            </div>
                
            {showSettings && (
                <div className="bg-slate-900/30 rounded-xl p-3 animate-in fade-in slide-in-from-bottom-2 border border-white/5">
                        <div className="flex justify-between items-center">
                            <label className="text-xs text-slate-400">Target Frequency</label>
                            <div className="flex items-center gap-2 bg-slate-900 rounded-lg p-1 border border-slate-700">
                                <Clock size={12} className="text-slate-500 ml-1"/>
                                <select 
                                className="bg-transparent text-xs text-slate-300 focus:outline-none py-1 pr-2"
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
                </div>
            )}
        </div>
    </div>
  );
}
