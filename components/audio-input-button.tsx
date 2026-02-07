"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

interface AudioInputButtonProps {
  onTranscript: (text: string) => void;
  className?: string;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
}

export function AudioInputButton({
  onTranscript,
  className,
  size = "md",
  disabled = false,
}: AudioInputButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4",
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
        await handleTranscription(audioBlob);
        
        // Cleanup stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.success("Recording started...", { duration: 2000, position: "bottom-center" });
    } catch (err) {
      console.error("Failed to start recording:", err);
      toast.error("Microphone access denied or not supported.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleTranscription = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.webm");

    try {
      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Transcription failed");
      }

      const { transcript } = await response.json();
      if (transcript) {
        onTranscript(transcript);
        toast.success("Voice transcribed!", { position: "bottom-center" });
      }
    } catch (err) {
      console.error("Transcription error:", err);
      toast.error("Failed to transcribe audio.");
    } finally {
      setIsTranscribing(false);
    }
  };

  const iconSize = {
    sm: 14,
    md: 18,
    lg: 22,
  }[size];

  const buttonSizeClass = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  }[size];

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 0.5 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{
              repeat: Infinity,
              duration: 1.5,
              ease: "easeInOut",
            }}
            className="absolute inset-0 rounded-full bg-red-500/30 blur-md pointer-events-none"
          />
        )}
      </AnimatePresence>

      <Button
        type="button"
        variant={isRecording ? "destructive" : "ghost"}
        size="icon"
        disabled={disabled || isTranscribing}
        onClick={isRecording ? stopRecording : startRecording}
        className={cn(
          "rounded-full transition-all duration-300",
          buttonSizeClass,
          !isRecording && "hover:bg-indigo-500/10 hover:text-indigo-400 text-slate-400",
          isRecording && "animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]"
        )}
      >
        {isTranscribing ? (
          <Loader2 className="animate-spin" size={iconSize} />
        ) : isRecording ? (
          <Square size={iconSize} fill="currentColor" />
        ) : (
          <Mic size={iconSize} />
        )}
      </Button>
    </div>
  );
}
