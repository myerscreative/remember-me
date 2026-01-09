"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Search, Loader2, BookOpen, Mic, MicOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { appendStoryNote } from "@/app/actions/story-actions";
import { toast } from "react-hot-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { getInitials, getGradient } from "@/lib/utils/contact-helpers";
import { Person } from "@/lib/supabase/types";
import { cleanupTranscribedText } from "@/lib/utils/text-cleanup";

interface QuickAddNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialContactId?: string;
  initialContactName?: string;
}

export function QuickAddNoteModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  initialContactId,
  initialContactName 
}: QuickAddNoteModalProps) {
  const [search, setSearch] = useState("");
  const [contacts, setContacts] = useState<Partial<Person>[]>([]);
  const [selectedContact, setSelectedContact] = useState<{id: string, name: string} | null>(
    initialContactId ? { id: initialContactId, name: initialContactName || "" } : null
  );
  const [note, setNote] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Voice state
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleSave = useCallback(async (currentNote?: string) => {
    const noteToSave = currentNote !== undefined ? currentNote : note;
    if (!selectedContact || !noteToSave.trim()) return;

    setIsSaving(true);
    try {
      const res = await appendStoryNote(selectedContact.id, cleanupTranscribedText(noteToSave));
      if (res.success) {
        toast.success("Note Recorded! 🎙️");
        setNote("");
        setSelectedContact(null);
        setSearch("");
        onSuccess?.();
        onClose();
      } else {
        toast.error(res.error || "Failed to save note");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setIsSaving(false);
    }
  }, [selectedContact, note, onSuccess, onClose]);

  // Handle auto-save timer
  const resetSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = setTimeout(() => {
      if (isListening) {
        stopListening();
        handleSave(note); // Pass the current note to handleSave
      }
    }, 3000);
  }, [isListening, handleSave, note]);

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error("Voice recognition not supported in this browser");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;

    recognitionRef.current.onstart = () => setIsListening(true);
    recognitionRef.current.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };
    recognitionRef.current.onend = () => setIsListening(false);

    recognitionRef.current.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        setNote(prev => prev + (prev ? " " : "") + finalTranscript);
        resetSilenceTimer();
      }
    };

    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  const searchContacts = useCallback(async () => {
    setIsSearching(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;

    const { data } = await supabase
      .from('persons')
      .select('id, name, first_name, last_name, photo_url')
      .ilike('name', `%${search}%`)
      .limit(5);

    setContacts(data || []);
    setIsSearching(false);
  }, [search]);

  useEffect(() => {
    if (search.length > 2) {
      searchContacts();
    } else if (search.length === 0) {
      setContacts([]);
    }
  }, [search, searchContacts]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-[425px] p-0 overflow-hidden border-none bg-slate-50 dark:bg-[#0f172a]"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="p-6 bg-white dark:bg-[#1e293b] border-b border-slate-100 dark:border-slate-800">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <BookOpen className="h-5 w-5 text-indigo-500" />
            Quick Story Note
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-4">
          {!selectedContact ? (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search contact..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 h-12 bg-white dark:bg-[#1e293b] border-slate-200 dark:border-slate-800 focus:ring-indigo-500 rounded-xl"
                />
              </div>

              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                {isSearching ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                  </div>
                ) : contacts.length > 0 ? (
                  contacts.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => setSelectedContact({ id: contact.id!, name: contact.name! })}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white dark:hover:bg-[#1e293b] hover:shadow-sm border border-transparent hover:border-slate-100 dark:hover:border-slate-800 transition-all text-left"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={contact.photo_url || undefined} />
                        <AvatarFallback className={cn("bg-linear-to-br text-white font-semibold", getGradient(contact.name || ""))}>
                          {getInitials(contact.first_name || "", contact.last_name || "")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{contact.name}</span>
                    </button>
                  ))
                ) : search.length > 2 ? (
                  <div className="text-center py-4 text-sm text-slate-500">No contacts found</div>
                ) : (
                   <div className="text-center py-4 text-sm text-slate-400">Search for a contact to start</div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-white dark:bg-[#1e293b] rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all duration-300">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border-2 border-slate-100 dark:border-slate-700">
                    <AvatarFallback className={cn("bg-linear-to-br text-white font-semibold", getGradient(selectedContact.name || ""))}>
                      {getInitials(selectedContact.name, "")}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-bold text-slate-700 dark:text-slate-200">{selectedContact.name}</span>
                </div>
                {!initialContactId && (
                  <Button variant="ghost" size="sm" onClick={() => setSelectedContact(null)} className="text-xs text-slate-500 hover:text-red-500 font-medium">
                    Change
                  </Button>
                )}
              </div>

              <div className="relative group">
                <Textarea
                  placeholder="What's the memory or insight? We'll add this to their story lore."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className={cn(
                    "min-h-[180px] bg-white dark:bg-[#1e293b] border-slate-200 dark:border-slate-800 focus:ring-indigo-500 rounded-xl resize-none p-4 pb-12 transition-all duration-300",
                    isListening && "border-blue-400 ring-2 ring-blue-400/20"
                  )}
                  autoFocus
                />
                
                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                  {isListening && (
                    <span className="flex h-3 w-3 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                    </span>
                  )}
                  <Button
                    onClick={toggleListening}
                    size="icon"
                    variant={isListening ? "default" : "outline"}
                    className={cn(
                      "h-10 w-10 rounded-full transition-all duration-300",
                      isListening ? "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30 scale-110" : "bg-white dark:bg-slate-800 text-slate-500 hover:text-blue-500 border-slate-200 dark:border-slate-700"
                    )}
                    title={isListening ? "Stop listening" : "Transcribe with voice"}
                  >
                    {isListening ? <Mic className="h-5 w-5 text-white" /> : <MicOff className="h-5 w-5" />}
                  </Button>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl h-12 font-bold border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  Cancel
                </Button>
                <Button 
                  onClick={() => handleSave()} 
                  disabled={isSaving || !note.trim()} 
                  className="flex-1 rounded-xl h-12 font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all active:scale-95"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save Note
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
