"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { VoiceRecorder } from "@/components/voice-recorder";
import { X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface QuickVoiceMemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  personId?: string | null;
  personName?: string | null;
}

export function QuickVoiceMemoModal({
  isOpen,
  onClose,
  personId,
  personName,
}: QuickVoiceMemoModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRecordingComplete = async (audioBlob: Blob) => {
    setIsProcessing(true);
    setError(null);
    setIsSaved(false);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      // Generate unique filename
      const timestamp = Date.now();
      const fileName = `voice-memo-${timestamp}.webm`;
      const filePath = `${user.id}/${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("attachments")
        .upload(filePath, audioBlob, {
          contentType: audioBlob.type,
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("attachments")
        .getPublicUrl(filePath);

      // Create attachment record in database
      const attachmentData: any = {
        user_id: user.id,
        file_name: fileName,
        file_url: urlData.publicUrl,
        file_type: audioBlob.type,
        file_size: audioBlob.size,
        attachment_type: "voice_note" as const,
        title: personName ? `Quick memo about ${personName}` : "Quick voice memo",
      };

      // If personId is provided, attach to that person
      if (personId) {
        attachmentData.person_id = personId;
      }

      const { error: dbError } = await supabase
        .from("attachments")
        .insert([attachmentData]);

      if (dbError) {
        throw dbError;
      }

      setIsSaved(true);

      // Auto-close after 1.5 seconds on success
      setTimeout(() => {
        handleClose();
      }, 1500);

    } catch (err) {
      console.error("Error saving voice memo:", err);
      setError(err instanceof Error ? err.message : "Failed to save voice memo");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setIsProcessing(false);
    setIsSaved(false);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Quick Voice Memo</h2>
            {personName && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Recording about {personName}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-8 w-8"
            disabled={isProcessing}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Success Display */}
          {isSaved && (
            <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <p className="text-sm text-green-600 dark:text-green-400">
                Voice memo saved successfully!
              </p>
            </div>
          )}

          {/* Instructions */}
          {!isSaved && !isProcessing && (
            <div className="text-center space-y-2">
              <p className="text-gray-700 dark:text-gray-300">
                Record a quick voice memo to capture thoughts, context, or reminders
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Your recording will be saved{personName ? ` with ${personName}'s profile` : ' to your attachments'}
              </p>
            </div>
          )}

          {/* Voice Recorder */}
          {!isSaved && (
            <VoiceRecorder
              onRecordingComplete={handleRecordingComplete}
              onError={(err) => {
                setError(err);
                setIsProcessing(false);
              }}
            />
          )}

          {/* Processing Indicator */}
          {isProcessing && (
            <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Saving voice memo...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
