"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { VoiceRecorder } from "@/components/voice-recorder";
import { X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { formatPhoneNumberDisplay } from "@/lib/utils";

interface ParsedContactData {
  name?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  whereMet?: string;
  introducedBy?: string;
  whyStayInContact?: string;
  whatInteresting?: string;
  whatsImportant?: string;
  firstImpression?: string;
  memorableMoment?: string;
  familyMembers?: Array<{ name: string; relationship: string }>;
  tags?: string;
  interests?: string;
  misc?: string;
}

interface VoiceEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (data: ParsedContactData) => void;
  existingData?: ParsedContactData;
}

export function VoiceEntryModal({
  isOpen,
  onClose,
  onApply,
  existingData,
}: VoiceEntryModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState<string>("");
  const [parsedData, setParsedData] = useState<ParsedContactData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<"record" | "transcript" | "review">("record");

  if (!isOpen) return null;

  const handleRecordingComplete = async (audioBlob: Blob) => {
    setIsProcessing(true);
    setError(null);

    try {
      // Step 1: Transcribe audio
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");

      const transcribeResponse = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!transcribeResponse.ok) {
        const errorData = await transcribeResponse.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to transcribe audio");
      }

      const { transcript: newTranscript } = await transcribeResponse.json();
      
      // Append to existing transcript if any
      const combinedTranscript = existingData && transcript
        ? `${transcript}\n\n${newTranscript}`
        : newTranscript;
      
      setTranscript(combinedTranscript);
      setCurrentStep("transcript");

      // Step 2: Parse transcript
      const parseResponse = await fetch("/api/parse-contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transcript: combinedTranscript }),
      });

      if (!parseResponse.ok) {
        const errorData = await parseResponse.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to parse transcript");
      }

      const parsed = await parseResponse.json();
      setParsedData(parsed);
      setCurrentStep("review");

    } catch (err) {
      console.error("Error processing recording:", err);
      setError(err instanceof Error ? err.message : "Failed to process recording");
      setCurrentStep("record");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRecordAnother = () => {
    setCurrentStep("record");
    setError(null);
  };

  const handleApply = () => {
    if (parsedData) {
      onApply(parsedData);
      handleClose();
    }
  };

  const handleClose = () => {
    setCurrentStep("record");
    setTranscript("");
    setParsedData(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-surface rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-default">
          <h2 className="text-xl font-bold text-text-primary">Quick Voice Entry</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-8 w-8"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 pb-32">
          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Step 1: Recording */}
          {currentStep === "record" && (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-text-tertiary font-medium mb-4">
                  Record all the information you have about this contact. Include any of the following:
                </p>
                
                {/* Field Prompts */}
                <div className="bg-subtle rounded-lg p-4 text-left space-y-3 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">•</span>
                      <div>
                        <span className="font-medium text-text-tertiary">Name:</span>
                        <span className="text-text-secondary"> &quot;Sarah Kim&quot; or &quot;John Smith&quot;</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">•</span>
                      <div>
                        <span className="font-medium text-text-tertiary">Email:</span>
                        <span className="text-text-secondary"> &quot;sarah@example.com&quot;</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">•</span>
                      <div>
                        <span className="font-medium text-text-tertiary">Phone:</span>
                        <span className="text-text-secondary"> &quot;555-123-4567&quot;</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">•</span>
                      <div>
                        <span className="font-medium text-text-tertiary">LinkedIn:</span>
                        <span className="text-text-secondary"> &quot;linkedin.com/in/username&quot;</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">•</span>
                      <div>
                        <span className="font-medium text-text-tertiary">Where we met:</span>
                        <span className="text-text-secondary"> &quot;AI Summit in San Diego&quot;</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">•</span>
                      <div>
                        <span className="font-medium text-text-tertiary">Who introduced:</span>
                        <span className="text-text-secondary"> &quot;John Park introduced us&quot;</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">•</span>
                      <div>
                        <span className="font-medium text-text-tertiary">Why stay in contact:</span>
                        <span className="text-text-secondary"> &quot;Building a startup that could align with FlowDoors&quot;</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">•</span>
                      <div>
                        <span className="font-medium text-text-tertiary">What&apos;s interesting:</span>
                        <span className="text-text-secondary"> &quot;Deep expertise in user empathy&quot;</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">•</span>
                      <div>
                        <span className="font-medium text-text-tertiary">What&apos;s important to them:</span>
                        <span className="text-text-secondary"> &quot;Passionate about sustainable design&quot;</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">•</span>
                      <div>
                        <span className="font-medium text-text-tertiary">Tags:</span>
                        <span className="text-text-secondary"> &quot;UX Designer, Tesla, Startup&quot;</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-text-secondary italic">
                  You don&apos;t need to include everything - just say what you know naturally!
                </p>
              </div>
              <VoiceRecorder
                onRecordingComplete={handleRecordingComplete}
                onError={(err) => {
                  setError(err);
                  setIsProcessing(false);
                }}
              />
              {isProcessing && (
                <div className="flex items-center justify-center gap-2 text-blue-600">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Processing audio...</span>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Transcript Review */}
          {currentStep === "transcript" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-text-primary">Transcript</h3>
                <Button variant="outline" onClick={handleRecordAnother}>
                  Record Another
                </Button>
              </div>
              <div className="p-4 bg-subtle rounded-lg max-h-64 overflow-y-auto">
                <p className="text-sm text-text-tertiary whitespace-pre-wrap">{transcript}</p>
              </div>
              {isProcessing && (
                <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Parsing transcript...</span>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Review Parsed Data */}
          {currentStep === "review" && parsedData && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                <h3 className="text-lg font-semibold text-text-primary">Review Extracted Information</h3>
              </div>
              <p className="text-sm text-text-secondary mb-4">
                Review the information extracted from your recording. You can edit any fields before applying.
              </p>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {parsedData.name && (
                  <div>
                    <label className="text-xs font-medium text-text-secondary">Name</label>
                    <div className="mt-1 p-2 bg-subtle rounded border border-border-strong text-text-primary">
                      {parsedData.name}
                    </div>
                  </div>
                )}
                {parsedData.email && (
                  <div>
                    <label className="text-xs font-medium text-text-secondary">Email</label>
                    <div className="mt-1 p-2 bg-subtle rounded border border-border-strong text-text-primary">
                      {parsedData.email}
                    </div>
                  </div>
                )}
                {parsedData.phone && (
                  <div>
                    <label className="text-xs font-medium text-text-secondary">Phone</label>
                    <div className="mt-1 p-2 bg-subtle rounded border border-border-strong text-text-primary">
                      {formatPhoneNumberDisplay(parsedData.phone)}
                    </div>
                  </div>
                )}
                {parsedData.linkedin && (
                  <div>
                    <label className="text-xs font-medium text-text-secondary">LinkedIn</label>
                    <div className="mt-1 p-2 bg-subtle rounded border border-border-strong text-text-primary">
                      {parsedData.linkedin}
                    </div>
                  </div>
                )}
                {parsedData.whereMet && (
                  <div>
                    <label className="text-xs font-medium text-text-secondary">Where We Met</label>
                    <div className="mt-1 p-2 bg-subtle rounded border border-border-strong text-text-primary">
                      {parsedData.whereMet}
                    </div>
                  </div>
                )}
                {parsedData.introducedBy && (
                  <div>
                    <label className="text-xs font-medium text-text-secondary">Who Introduced</label>
                    <div className="mt-1 p-2 bg-subtle rounded border border-border-strong text-text-primary">
                      {parsedData.introducedBy}
                    </div>
                  </div>
                )}
                {parsedData.whyStayInContact && (
                  <div>
                    <label className="text-xs font-medium text-text-secondary">Why Stay in Contact</label>
                    <div className="mt-1 p-2 bg-subtle rounded border border-border-strong text-text-primary">
                      {parsedData.whyStayInContact}
                    </div>
                  </div>
                )}
                {parsedData.whatInteresting && (
                  <div>
                    <label className="text-xs font-medium text-text-secondary">What&apos;s Interesting</label>
                    <div className="mt-1 p-2 bg-subtle rounded border border-border-strong text-text-primary">
                      {parsedData.whatInteresting}
                    </div>
                  </div>
                )}
                {parsedData.whatsImportant && (
                  <div>
                    <label className="text-xs font-medium text-text-secondary">What&apos;s Important to Them</label>
                    <div className="mt-1 p-2 bg-subtle rounded border border-border-strong text-text-primary">
                      {parsedData.whatsImportant}
                    </div>
                  </div>
                )}
                {parsedData.familyMembers && parsedData.familyMembers.length > 0 && (
                  <div>
                    <label className="text-xs font-medium text-text-secondary">Family Members</label>
                    <div className="mt-1 space-y-1">
                      {parsedData.familyMembers.map((member, index) => (
                        <div key={index} className="p-2 bg-subtle rounded border border-border-strong text-text-primary">
                          <span className="font-medium">{member.name}</span>
                          <span className="text-text-secondary ml-2">({member.relationship})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {parsedData.tags && (
                  <div>
                    <label className="text-xs font-medium text-text-secondary">Tags</label>
                    <div className="mt-1 p-2 bg-subtle rounded border border-border-strong text-text-primary">
                      {parsedData.tags}
                    </div>
                  </div>
                )}
                {parsedData.interests && (
                  <div>
                    <label className="text-xs font-medium text-text-secondary">Interests</label>
                    <div className="mt-1 p-2 bg-subtle rounded border border-border-strong text-text-primary">
                      {parsedData.interests}
                    </div>
                  </div>
                )}
                {parsedData.misc && (
                  <div>
                    <label className="text-xs font-medium text-text-secondary">Misc</label>
                    <div className="mt-1 p-2 bg-subtle rounded border border-border-strong text-text-primary">
                      {parsedData.misc}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={handleRecordAnother} className="flex-1">
                  Record Another
                </Button>
                <Button onClick={handleApply} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  Apply to Form
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

