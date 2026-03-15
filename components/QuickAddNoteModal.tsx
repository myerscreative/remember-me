"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Search, Loader2, BookOpen, Mic, Square } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { addQuickEntryNote } from "@/app/actions/story-actions";
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
  
  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaChunksRef = useRef<Blob[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleSave = useCallback(async (currentNote?: string) => {
    const noteToSave = currentNote !== undefined ? currentNote : note;
    if (!selectedContact || !noteToSave.trim()) return;

    setIsSaving(true);
    try {
      const res = await addQuickEntryNote(selectedContact.id, cleanupTranscribedText(noteToSave));
      if (res.success) {
        const parts: string[] = [];
        if (res.captured?.location) parts.push(res.captured.location);
        if (res.captured?.interests?.length) parts.push(res.captured.interests.join(", "));
        const capturedText = parts.length > 0 ? ` Captured: ${parts.join(" and ")}.` : "";
        toast.success(`Saved!${capturedText}`);
        setNote("");
        setSelectedContact(null);
        setSearch("");
        onSuccess?.();
        onClose();
      } else {
        toast.error(res.error || "Failed to save note");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsSaving(false);
    }
  }, [selectedContact, note, onSuccess, onClose]);

  const stopMediaTracks = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const transcribeRecording = useCallback(async (audioBlob: Blob, mimeType: string) => {
    setIsTranscribing(true);
    const formData = new FormData();
    const extension = mimeType.includes("mp4") ? "mp4" : "webm";
    formData.append("audio", audioBlob, `quick-entry.${extension}`);

    try {
      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to transcribe audio");
      }

      const data = await response.json();
      const transcript = cleanupTranscribedText(data.transcript || "");

      if (transcript) {
        setNote((prev) => {
          const separator = prev.trim() ? "\n" : "";
          return `${prev}${separator}${transcript}`;
        });
        toast.success("Transcript added to Shared Memory");
      }
    } catch (error) {
      console.error("Audio transcription failed:", error);
      toast.error(error instanceof Error ? error.message : "Transcription failed");
    } finally {
      setIsTranscribing(false);
    }
  }, []);

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      toast.error("Audio recording is not supported in this browser");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "";
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;
      mediaChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          mediaChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const resolvedMimeType = recorder.mimeType || "audio/webm";
        const audioBlob = new Blob(mediaChunksRef.current, { type: resolvedMimeType });
        if (audioBlob.size > 0) {
          await transcribeRecording(audioBlob, resolvedMimeType);
        }
        stopMediaTracks();
      };

      recorder.start();
      setRecordingSeconds(0);
      setIsRecording(true);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Failed to start recording:", error);
      toast.error("Microphone permission is required for recording");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const toggleRecording = () => {
    if (isTranscribing || isSaving) return;
    if (isRecording) {
      stopRecording();
      return;
    }
    startRecording();
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      stopMediaTracks();
    };
  }, [stopMediaTracks]);

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
      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden border-none bg-slate-950">
        <DialogHeader className="p-6 bg-slate-900 border-b border-slate-800">
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
                  className="pl-10 h-12 bg-slate-900 border-slate-800 focus:ring-indigo-500 rounded-xl"
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
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-900 hover:shadow-sm border border-transparent hover:border-slate-800 transition-all text-left"
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
              <div className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-800 shadow-sm transition-all duration-300">
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
                    "min-h-[180px] bg-slate-900 border-slate-800 focus:ring-indigo-500 rounded-xl resize-none p-4 pb-16 transition-all duration-300 text-slate-200",
                    isRecording && "border-indigo-500 ring-2 ring-indigo-500/20"
                  )}
                  autoFocus
                />
                
                <div className="absolute inset-x-3 bottom-3 flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-950/70 px-2 py-1.5">
                  <p className="min-h-[20px] text-[11px] text-slate-400">
                    {isTranscribing
                      ? "Transcribing audio..."
                      : isRecording
                      ? `Recording ${formatTime(recordingSeconds)}`
                      : "Tap mic to dictate"}
                  </p>
                  <Button
                    onClick={toggleRecording}
                    size="icon"
                    variant={isRecording ? "default" : "outline"}
                    disabled={isTranscribing || isSaving}
                    className={cn(
                      "h-9 w-9 shrink-0 rounded-full transition-all duration-300",
                      isRecording
                        ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/30"
                        : "bg-white dark:bg-slate-800 text-slate-500 hover:text-indigo-500 border-slate-200 dark:border-slate-700"
                    )}
                    title={isRecording ? "Stop recording" : "Record voice note"}
                  >
                    {isTranscribing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isRecording ? (
                      <Square className="h-4 w-4 fill-current" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
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
