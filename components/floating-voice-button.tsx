"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Plus, FileAudio } from "lucide-react";
import { VoiceEntryModal } from "@/components/voice-entry-modal";
import { QuickVoiceMemoModal } from "@/components/quick-voice-memo-modal";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface FloatingVoiceButtonProps {
  className?: string;
}

export function FloatingVoiceButton({ className }: FloatingVoiceButtonProps) {
  const [isNewContactModalOpen, setIsNewContactModalOpen] = useState(false);
  const [isQuickMemoModalOpen, setIsQuickMemoModalOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentPerson, setCurrentPerson] = useState<{ id: string; name: string } | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Detect if we're on a contact detail page
  useEffect(() => {
    const contactMatch = pathname.match(/^\/contacts\/([^/]+)$/);
    if (contactMatch && contactMatch[1] !== 'new') {
      const personId = contactMatch[1];
      // Fetch person name
      const fetchPersonName = async () => {
        const supabase = createClient();
        const { data } = await supabase
          .from('persons')
          .select('id, name, first_name, last_name')
          .eq('id', personId)
          .single();

        if (data) {
          setCurrentPerson({
            id: data.id,
            name: data.name || `${data.first_name} ${data.last_name || ''}`.trim()
          });
        }
      };
      fetchPersonName();
    } else {
      setCurrentPerson(null);
    }
  }, [pathname]);

  // Don't show on certain pages where it might interfere
  const hideOnPages = [
    '/login',
    '/signup',
    '/contacts/new',
    '/quick-capture',
  ];

  if (hideOnPages.includes(pathname)) {
    return null;
  }

  const handleVoiceDataApply = async (data: any) => {
    setIsSaving(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.error("User not authenticated");
        return;
      }

      // Parse name into first_name and last_name
      const nameParts = (data.name || "").trim().split(/\s+/);
      const firstName = nameParts[0] || "";
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : null;

      // Prepare contact data
      const contactData = {
        user_id: user.id,
        name: data.name || "",
        first_name: firstName,
        last_name: lastName,
        email: data.email || null,
        phone: data.phone || null,
        linkedin: data.linkedin || null,
        where_met: data.whereMet || null,
        who_introduced: data.introducedBy || null,
        why_stay_in_contact: data.whyStayInContact || null,
        what_found_interesting: data.whatInteresting || null,
        most_important_to_them: data.whatsImportant || null,
        family_members: data.familyMembers || null,
        interests: data.tags ? data.tags.split(',').map((t: string) => t.trim()) : null,
        notes: data.misc || null,
        imported: false, // This is a manually added contact via voice
        has_context: true, // Voice capture means it has context
      };

      // Insert contact
      const { data: newContact, error } = await supabase
        .from("persons")
        .insert([contactData])
        .select()
        .single();

      if (error) {
        console.error("Error saving contact:", error);
        alert("Failed to save contact. Please try again.");
        return;
      }

      // Close modal and navigate to the new contact
      setIsNewContactModalOpen(false);
      router.push(`/contacts/${newContact.id}`);
      router.refresh();

    } catch (error) {
      console.error("Error in handleVoiceDataApply:", error);
      alert("Failed to save contact. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleMainButtonClick = () => {
    // If on a contact page, show menu with options
    if (currentPerson) {
      setShowMenu(!showMenu);
    } else {
      // Otherwise, directly open new contact modal
      setIsNewContactModalOpen(true);
    }
  };

  const handleQuickMemoClick = () => {
    setShowMenu(false);
    setIsQuickMemoModalOpen(true);
  };

  const handleNewContactClick = () => {
    setShowMenu(false);
    setIsNewContactModalOpen(true);
  };

  return (
    <>
      {/* Menu Options (shown when on contact page) */}
      {showMenu && currentPerson && (
        <>
          {/* Backdrop to close menu */}
          <div
            className="fixed inset-0 z-30 bg-transparent"
            onClick={() => setShowMenu(false)}
          />

          {/* Menu Items */}
          <div className="fixed bottom-36 right-6 md:bottom-24 md:right-6 z-40 flex flex-col gap-3">
            {/* Quick Memo Option */}
            <Button
              onClick={handleQuickMemoClick}
              className={cn(
                "h-12 px-4 rounded-full shadow-lg",
                "bg-blue-600 hover:bg-blue-700 text-white",
                "transition-all duration-200 ease-in-out",
                "hover:scale-105 active:scale-95",
                "flex items-center gap-2"
              )}
              title={`Quick memo about ${currentPerson.name}`}
            >
              <FileAudio className="h-5 w-5" />
              <span className="text-sm font-medium">Quick Memo</span>
            </Button>

            {/* New Contact Option */}
            <Button
              onClick={handleNewContactClick}
              className={cn(
                "h-12 px-4 rounded-full shadow-lg",
                "bg-green-600 hover:bg-green-700 text-white",
                "transition-all duration-200 ease-in-out",
                "hover:scale-105 active:scale-95",
                "flex items-center gap-2"
              )}
              title="Add new contact with voice"
            >
              <Plus className="h-5 w-5" />
              <span className="text-sm font-medium">New Contact</span>
            </Button>
          </div>
        </>
      )}

      {/* Main Floating Action Button */}
      <Button
        onClick={handleMainButtonClick}
        className={cn(
          "fixed bottom-20 right-6 md:bottom-6 md:right-6 z-40",
          "h-14 w-14 rounded-full shadow-lg",
          showMenu ? "bg-gray-600 hover:bg-gray-700" : "bg-purple-600 hover:bg-purple-700",
          "text-white",
          "transition-all duration-200 ease-in-out",
          showMenu ? "rotate-45" : "hover:scale-110 active:scale-95",
          "focus:outline-none focus:ring-4 focus:ring-purple-300 dark:focus:ring-purple-800",
          className
        )}
        size="icon"
        aria-label={showMenu ? "Close menu" : "Quick voice capture"}
        title={
          currentPerson
            ? "Voice options"
            : "Quick voice capture - Add a contact by speaking"
        }
      >
        {showMenu ? (
          <Plus className="h-6 w-6" />
        ) : (
          <Mic className="h-6 w-6" />
        )}
      </Button>

      {/* Pulsing ring animation when button is visible (only when menu is closed) */}
      {!showMenu && (
        <div
          className={cn(
            "fixed bottom-20 right-6 md:bottom-6 md:right-6 z-30",
            "h-14 w-14 rounded-full",
            "bg-purple-400 dark:bg-purple-500",
            "animate-ping opacity-20",
            "pointer-events-none"
          )}
        />
      )}

      {/* Voice Entry Modal for New Contacts */}
      <VoiceEntryModal
        isOpen={isNewContactModalOpen}
        onClose={() => setIsNewContactModalOpen(false)}
        onApply={handleVoiceDataApply}
      />

      {/* Quick Voice Memo Modal for Existing Contacts */}
      <QuickVoiceMemoModal
        isOpen={isQuickMemoModalOpen}
        onClose={() => setIsQuickMemoModalOpen(false)}
        personId={currentPerson?.id || null}
        personName={currentPerson?.name || null}
      />
    </>
  );
}
