"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VoiceRecorder } from "@/components/voice-recorder";
import { X, Loader2, CheckCircle2, AlertCircle, Users, Mic, Edit3 } from "lucide-react";
import { formatPhoneNumberDisplay } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";

interface ParsedContactData {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  linkedin?: string | null;
  company?: string | null;
  jobTitle?: string | null;
  whereMet?: string | null;
  whenMet?: string | null;
  introducedBy?: string | null;
  whyStayInContact?: string | null;
  whatInteresting?: string | null;
  whatsImportant?: string | null;
  interests?: string[] | null;
  skills?: string[] | null;
  familyMembers?: Array<{ name: string; relationship: string }> | null;
  birthday?: string | null;
  notes?: string | null;
  tags?: string[] | null;
}

interface SimilarContact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  photo_url: string | null;
  similarity_score: number;
  similarity_reasons: string[];
  summary?: string;
}

interface VoiceEntryModalEnhancedProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (data: ParsedContactData) => void;
  onSelectExistingContact?: (contactId: string) => void;
  userId: string;
  existingData?: ParsedContactData;
}

export function VoiceEntryModalEnhanced({
  isOpen,
  onClose,
  onApply,
  onSelectExistingContact,
  userId,
  existingData,
}: VoiceEntryModalEnhancedProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState<string>("");
  const [parsedData, setParsedData] = useState<ParsedContactData | null>(null);
  const [intent, setIntent] = useState<"new" | "update" | null>(null);
  const [matchedContact, setMatchedContact] = useState<any>(null);
  const [similarContacts, setSimilarContacts] = useState<SimilarContact[]>([]);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<"record" | "transcript" | "review" | "missing" | "similar">("record");
  const [additionalInfo, setAdditionalInfo] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setCurrentStep("record");
      setTranscript("");
      setParsedData(null);
      setIntent(null);
      setMatchedContact(null);
      setSimilarContacts([]);
      setMissingFields([]);
      setError(null);
      setAdditionalInfo({});
    }
  }, [isOpen]);

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

      setTranscript(newTranscript);
      setCurrentStep("transcript");

      // Step 2: Parse with enhanced AI
      const parseResponse = await fetch("/api/parse-voice-input", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcript: newTranscript,
          userId
        }),
      });

      if (!parseResponse.ok) {
        const errorData = await parseResponse.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to parse transcript");
      }

      const parsed = await parseResponse.json();

      setIntent(parsed.intent);
      setMatchedContact(parsed.matchedContact);
      setParsedData(parsed.parsedData);
      setMissingFields(parsed.missingFields || []);

      // Step 3: Find similar contacts (only for new contacts)
      if (parsed.intent === "new" && parsed.parsedData) {
        try {
          const similarResponse = await fetch("/api/find-similar-contacts", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId,
              contactData: parsed.parsedData,
            }),
          });

          if (similarResponse.ok) {
            const { similarContacts: similar } = await similarResponse.json();
            setSimilarContacts(similar || []);

            // Show similar contacts if found
            if (similar && similar.length > 0) {
              setCurrentStep("similar");
              setIsProcessing(false);
              return;
            }
          }
        } catch (err) {
          console.error("Error finding similar contacts:", err);
          // Continue without similar contacts
        }
      }

      // Step 4: Check for missing fields
      if (parsed.missingFields && parsed.missingFields.length > 0) {
        setCurrentStep("missing");
      } else {
        setCurrentStep("review");
      }

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

  const handleSkipMissing = () => {
    setCurrentStep("review");
  };

  const handleProvideMissing = () => {
    // Merge additional info into parsed data
    const updatedData = { ...parsedData };

    Object.entries(additionalInfo).forEach(([field, value]) => {
      if (value && value.trim()) {
        (updatedData as any)[field] = value.trim();
      }
    });

    setParsedData(updatedData);
    setMissingFields([]);
    setCurrentStep("review");
  };

  const handleSkipSimilar = () => {
    // Check for missing fields or go to review
    if (missingFields && missingFields.length > 0) {
      setCurrentStep("missing");
    } else {
      setCurrentStep("review");
    }
  };

  const handleSelectSimilar = (contactId: string) => {
    if (onSelectExistingContact) {
      onSelectExistingContact(contactId);
      handleClose();
    }
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
    setIntent(null);
    setMatchedContact(null);
    setSimilarContacts([]);
    setMissingFields([]);
    setError(null);
    setAdditionalInfo({});
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">AI Voice Entry</h2>
          </div>
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
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Step 1: Recording */}
          {currentStep === "record" && (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-gray-700 font-medium mb-2">
                  Speak naturally about the contact
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  You can say things like:
                </p>

                <div className="bg-linear-to-r from-blue-50 to-purple-50 rounded-lg p-4 text-left space-y-2 mb-4">
                  <p className="text-sm text-gray-700">
                    📝 <span className="font-medium">"I just met Sarah Johnson at the AI Summit.
                    She's a product manager at Tesla working on autonomous driving.
                    Her email is sarah@tesla.com. We talked about user experience design
                    and she's really interested in sustainable tech. She has two kids,
                    Emma and Jake."</span>
                  </p>
                  <div className="border-t border-gray-200 my-2"></div>
                  <p className="text-sm text-gray-700">
                    🔄 <span className="font-medium">"Update John Smith - he just told me he's
                    moving to Google and starting a new role as engineering director.
                    His new email is john@google.com."</span>
                  </p>
                </div>

                <p className="text-xs text-gray-500 italic">
                  The AI will automatically detect whether you're adding a new contact
                  or updating an existing one, and extract all the relevant information.
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
                  <span>Processing with AI...</span>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Transcript Review */}
          {currentStep === "transcript" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Transcript</h3>
                <Button variant="outline" size="sm" onClick={handleRecordAnother}>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Re-record
                </Button>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg max-h-64 overflow-y-auto">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{transcript}</p>
              </div>
              {isProcessing && (
                <div className="flex items-center justify-center gap-2 text-blue-600">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>AI is analyzing and extracting information...</span>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Similar Contacts Found */}
          {currentStep === "similar" && similarContacts.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Similar Contacts Found</h3>
              </div>
              <p className="text-sm text-gray-600">
                We found {similarContacts.length} contact{similarContacts.length > 1 ? "s" : ""} with similar information.
                Did you mean to update one of these instead?
              </p>

              <div className="space-y-3 max-h-80 overflow-y-auto">
                {similarContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer"
                    onClick={() => handleSelectSimilar(contact.id)}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12 bg-linear-to-br from-blue-400 to-purple-500 text-white flex items-center justify-center">
                        {contact.photo_url ? (
                          <img src={contact.photo_url} alt={contact.name} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-lg font-semibold">
                            {contact.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                          </span>
                        )}
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{contact.name}</div>
                        {contact.email && (
                          <div className="text-sm text-gray-600">{contact.email}</div>
                        )}
                        {contact.phone && (
                          <div className="text-sm text-gray-600">{formatPhoneNumberDisplay(contact.phone)}</div>
                        )}
                        <div className="mt-2 text-sm text-gray-700">
                          {contact.summary || contact.similarity_reasons.join(" • ")}
                        </div>
                        <div className="mt-1">
                          <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                            {contact.similarity_score}% match
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={handleSkipSimilar} className="flex-1">
                  No, Continue with New Contact
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Missing Information */}
          {currentStep === "missing" && missingFields.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <h3 className="text-lg font-semibold">Missing Information</h3>
              </div>
              <p className="text-sm text-gray-600">
                The following fields are recommended for new contacts. You can fill them now or skip:
              </p>

              <div className="space-y-3">
                {missingFields.map((field) => (
                  <div key={field}>
                    <label className="text-sm font-medium text-gray-700 capitalize">
                      {field === "email" ? "Email Address" : field === "phone" ? "Phone Number" : field}
                    </label>
                    <Input
                      placeholder={`Enter ${field}`}
                      value={additionalInfo[field] || ""}
                      onChange={(e) => setAdditionalInfo({ ...additionalInfo, [field]: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={handleSkipMissing} className="flex-1">
                  Skip for Now
                </Button>
                <Button onClick={handleProvideMissing} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Step 5: Review Parsed Data */}
          {currentStep === "review" && parsedData && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-semibold">
                  {intent === "update" ? "Update Contact" : "Review Information"}
                </h3>
              </div>

              {intent === "update" && matchedContact && !matchedContact.multiple && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <span className="font-semibold">Updating:</span> {matchedContact.name}
                  </p>
                </div>
              )}

              {intent === "update" && matchedContact?.multiple && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-700 font-semibold mb-2">Multiple matches found. Select one:</p>
                  <div className="space-y-2">
                    {matchedContact.matches.map((match: any) => (
                      <button
                        key={match.id}
                        className="w-full text-left p-2 bg-white border border-gray-200 rounded hover:border-blue-300 hover:bg-blue-50"
                        onClick={() => handleSelectSimilar(match.id)}
                      >
                        <div className="font-medium">{match.name}</div>
                        {match.email && <div className="text-sm text-gray-600">{match.email}</div>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-sm text-gray-600">
                AI extracted the following information. Review before applying:
              </p>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {Object.entries(parsedData).map(([key, value]) => {
                  if (!value) return null;

                  const label = key
                    .replace(/([A-Z])/g, " $1")
                    .replace(/^./, (str) => str.toUpperCase());

                  if (Array.isArray(value)) {
                    if (value.length === 0) return null;

                    if (key === "familyMembers") {
                      return (
                        <div key={key}>
                          <label className="text-xs font-medium text-gray-500">{label}</label>
                          <div className="mt-1 space-y-1">
                            {value.map((member: any, index: number) => (
                              <div key={index} className="p-2 bg-gray-50 rounded border border-gray-200">
                                <span className="font-medium">{member.name}</span>
                                <span className="text-gray-500 ml-2">({member.relationship})</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={key}>
                        <label className="text-xs font-medium text-gray-500">{label}</label>
                        <div className="mt-1 p-2 bg-gray-50 rounded border border-gray-200">
                          {value.join(", ")}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={key}>
                      <label className="text-xs font-medium text-gray-500">{label}</label>
                      <div className="mt-1 p-2 bg-gray-50 rounded border border-gray-200">
                        {key === "phone" ? formatPhoneNumberDisplay(value as string) : value as string}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={handleRecordAnother} className="flex-1">
                  Record Again
                </Button>
                <Button onClick={handleApply} className="flex-1 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
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
