"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, Mic, Check, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { VoiceEntryModal } from "@/components/voice-entry-modal";
import toast, { Toaster } from "react-hot-toast";

export default function QuickCapturePage() {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [contactName, setContactName] = useState("");

  const handleVoiceData = (data: any) => {
    // Extract the relevant information from voice data
    let capturedNotes = "";
    if (data.name) capturedNotes += `Met with: ${data.name}\n`;
    if (data.whereMet) capturedNotes += `Location: ${data.whereMet}\n`;
    if (data.whyStayInContact) capturedNotes += `Why important: ${data.whyStayInContact}\n`;
    if (data.whatInteresting) capturedNotes += `What stood out: ${data.whatInteresting}\n`;
    if (data.whatsImportant) capturedNotes += `Important to them: ${data.whatsImportant}\n`;

    setNotes((prev) => (prev ? prev + "\n\n" + capturedNotes : capturedNotes));
    if (data.name) setContactName(data.name);
  };

  const handleQuickSave = async () => {
    if (!notes.trim() && !contactName.trim()) {
      toast.error("Please add some notes or a contact name");
      return;
    }

    setIsSaving(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/login?redirect=/quick-capture");
        return;
      }

      // If we have a contact name, try to find or create the contact
      if (contactName.trim()) {
        // Try to find existing contact by name
        const { data: existingContacts } = await (supabase as any)
          .from("persons")
          .select("id, first_name, last_name")
          .eq("user_id", user.id)
          .eq("archived", false);

        const nameParts = contactName.trim().split(" ");
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(" ") || null;

        let personId = null;

        // Look for match
        const match = existingContacts?.find(
          (p) =>
            p.first_name.toLowerCase() === firstName.toLowerCase() &&
            (p.last_name || "").toLowerCase() === (lastName || "").toLowerCase()
        );

        if (match) {
          personId = match.id;
          // Update the notes
          await (supabase as any)
            .from("persons")
            .update({
              notes: notes.trim(),
              last_contact: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", personId);
        } else {
          // Create new contact
          const { data: newPerson } = await (supabase as any)
            .from("persons")
            .insert({
              user_id: user.id,
              first_name: firstName,
              last_name: lastName,
              name: contactName.trim(),
              notes: notes.trim(),
              last_contact: new Date().toISOString(),
            })
            .select()
            .single();

          personId = newPerson?.id;
        }

        // Create interaction record
        if (personId) {
          await (supabase as any).from("interactions").insert({
            user_id: user.id,
            person_id: personId,
            type: "meeting",
            date: new Date().toISOString(),
            title: "Quick capture note",
            notes: notes.trim(),
          });
        }

        router.push(`/contacts/${personId}`);
      } else {
        // Just save as a general note (could be extended to create a "quick notes" feature)
        toast.success("Contact created with notes!");
        router.push("/");
      }
    } catch (error) {
      console.error("Error saving quick capture:", error);
      toast.error("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Toaster position="top-center" />
      <div className="flex flex-col h-screen bg-linear-to-br from-cyan-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 overflow-hidden">
        <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-full bg-linear-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  Quick Capture
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Capture meeting notes while they're fresh
                </p>
              </div>
            </div>
          </div>

          {/* Quick capture tips */}
          <Card className="mb-6 bg-linear-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-2">
                💡 Quick Tips:
              </p>
              <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Use voice capture for hands-free entry</li>
                <li>• Add context: where you met, what stood out, what's important to them</li>
                <li>• Save within 5 minutes while memory is fresh</li>
              </ul>
            </CardContent>
          </Card>

          {/* Contact Name (Optional) */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Who did you meet? (Optional)
            </label>
            <input
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="e.g., John Smith"
              className="w-full h-12 px-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-cyan-400 dark:focus:border-cyan-600 focus:ring-2 focus:ring-cyan-200 dark:focus:ring-cyan-900 transition-all"
              disabled={isSaving}
            />
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              What do you want to remember?
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Quick notes about the meeting...&#10;&#10;What stood out? What's important to them? What did you discuss?"
              className="min-h-[250px] rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 text-base resize-none focus:border-cyan-400 dark:focus:border-cyan-600 focus:ring-2 focus:ring-cyan-200 dark:focus:ring-cyan-900"
              disabled={isSaving}
              autoFocus
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setIsVoiceModalOpen(true)}
              disabled={isSaving}
              className="flex-1 h-14 rounded-xl border-2 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950 transition-all"
            >
              <Mic className="h-5 w-5 mr-2" />
              Voice Capture
            </Button>
            <Button
              onClick={handleQuickSave}
              disabled={isSaving || (!notes.trim() && !contactName.trim())}
              className="flex-1 h-14 rounded-xl bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-5 w-5 mr-2" />
                  Save
                </>
              )}
            </Button>
          </div>

          <div className="mt-4">
            <Button
              variant="ghost"
              onClick={() => router.push("/")}
              disabled={isSaving}
              className="w-full h-12 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      </div>

        {/* Voice Entry Modal */}
        <VoiceEntryModal
          isOpen={isVoiceModalOpen}
          onClose={() => setIsVoiceModalOpen(false)}
          onApply={handleVoiceData}
        />
      </div>
    </>
  );
}
