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
  familyMembers?: Array<{ name: string; relationship: string }>;
  tags?: string;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Quick Voice Entry</h2>
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
        <div className="p-6 space-y-6">
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
                <p className="text-gray-700 dark:text-gray-300 font-medium mb-4">
                  Record all the information you have about this contact. Include any of the following:
                </p>
                
                {/* Field Prompts */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-left space-y-3 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">•</span>
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Name:</span>
                        <span className="text-gray-600 dark:text-gray-400"> "Sarah Kim" or "John Smith"</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">•</span>
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Email:</span>
                        <span className="text-gray-600 dark:text-gray-400"> "sarah@example.com"</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">•</span>
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Phone:</span>
                        <span className="text-gray-600 dark:text-gray-400"> "555-123-4567"</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">•</span>
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">LinkedIn:</span>
                        <span className="text-gray-600 dark:text-gray-400"> "linkedin.com/in/username"</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">•</span>
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Where we met:</span>
                        <span className="text-gray-600 dark:text-gray-400"> "AI Summit in San Diego"</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">•</span>
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Who introduced:</span>
                        <span className="text-gray-600 dark:text-gray-400"> "John Park introduced us"</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">•</span>
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Why stay in contact:</span>
                        <span className="text-gray-600 dark:text-gray-400"> "Building a startup that could align with FlowDoors"</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">•</span>
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">What's interesting:</span>
                        <span className="text-gray-600 dark:text-gray-400"> "Deep expertise in user empathy"</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">•</span>
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">What's important to them:</span>
                        <span className="text-gray-600 dark:text-gray-400"> "Passionate about sustainable design"</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">•</span>
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Tags:</span>
                        <span className="text-gray-600 dark:text-gray-400"> "UX Designer, Tesla, Startup"</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                  You don't need to include everything - just say what you know naturally!
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
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Transcript</h3>
                <Button variant="outline" onClick={handleRecordAnother}>
                  Record Another
                </Button>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg max-h-64 overflow-y-auto">
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{transcript}</p>
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
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Review Extracted Information</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Review the information extracted from your recording. You can edit any fields before applying.
              </p>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {parsedData.name && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Name</label>
                    <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white">
                      {parsedData.name}
                    </div>
                  </div>
                )}
                {parsedData.email && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Email</label>
                    <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white">
                      {parsedData.email}
                    </div>
                  </div>
                )}
                {parsedData.phone && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Phone</label>
                    <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white">
                      {formatPhoneNumberDisplay(parsedData.phone)}
                    </div>
                  </div>
                )}
                {parsedData.linkedin && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">LinkedIn</label>
                    <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white">
                      {parsedData.linkedin}
                    </div>
                  </div>
                )}
                {parsedData.whereMet && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Where We Met</label>
                    <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white">
                      {parsedData.whereMet}
                    </div>
                  </div>
                )}
                {parsedData.introducedBy && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Who Introduced</label>
                    <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white">
                      {parsedData.introducedBy}
                    </div>
                  </div>
                )}
                {parsedData.whyStayInContact && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Why Stay in Contact</label>
                    <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white">
                      {parsedData.whyStayInContact}
                    </div>
                  </div>
                )}
                {parsedData.whatInteresting && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">What's Interesting</label>
                    <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white">
                      {parsedData.whatInteresting}
                    </div>
                  </div>
                )}
                {parsedData.whatsImportant && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">What's Important to Them</label>
                    <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white">
                      {parsedData.whatsImportant}
                    </div>
                  </div>
                )}
                {parsedData.familyMembers && parsedData.familyMembers.length > 0 && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Family Members</label>
                    <div className="mt-1 space-y-1">
                      {parsedData.familyMembers.map((member, index) => (
                        <div key={index} className="p-2 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white">
                          <span className="font-medium">{member.name}</span>
                          <span className="text-gray-500 dark:text-gray-400 ml-2">({member.relationship})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {parsedData.tags && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Tags</label>
                    <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white">
                      {parsedData.tags}
                    </div>
                  </div>
                )}
                {parsedData.misc && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Misc</label>
                    <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white">
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

