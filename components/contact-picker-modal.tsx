"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, Search, Loader2, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Person } from "@/types/database.types";
import { cn } from "@/lib/utils";

// Helper function to get initials from name
const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// Helper function to get gradient color based on name hash
const getGradient = (name: string): string => {
  const gradients = [
    "from-purple-500 to-blue-500",
    "from-green-500 to-blue-500",
    "from-orange-500 to-yellow-500",
    "from-cyan-500 to-green-500",
    "from-pink-500 to-red-500",
    "from-indigo-500 to-purple-500",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
};

interface ContactPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  loopGroupId: string;
  loopGroupName: string;
  onSuccess: () => void;
}

export function ContactPickerModal({
  isOpen,
  onClose,
  loopGroupId,
  loopGroupName,
  onSuccess,
}: ContactPickerModalProps) {
  const [allContacts, setAllContacts] = useState<Person[]>([]);
  const [existingContactIds, setExistingContactIds] = useState<Set<string>>(new Set());
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadContacts();
    } else {
      // Reset state when modal closes
      setSearchQuery("");
      setSelectedContactIds(new Set());
      setError(null);
    }
  }, [isOpen, loopGroupId]);

  const loadContacts = async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError("You must be logged in");
        setLoading(false);
        return;
      }

      // Fetch all contacts
      const { data: persons, error: personsError } = await supabase
        .from("persons")
        .select("*")
        .eq("user_id", user.id)
        .order("name");

      if (personsError) {
        console.error("Error fetching contacts:", personsError);
        setError("Failed to load contacts");
        setLoading(false);
        return;
      }

      // Fetch existing contacts in this loop group
      const { data: personLoopGroups, error: plgError } = await supabase
        .from("person_loop_groups")
        .select("person_id")
        .eq("loop_group_id", loopGroupId);

      if (plgError) {
        console.error("Error fetching loop group contacts:", plgError);
      }

      const existingIds = new Set(
        (personLoopGroups || []).map((plg) => plg.person_id)
      );

      setAllContacts(persons || []);
      setExistingContactIds(existingIds);
    } catch (err) {
      console.error("Error loading contacts:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const toggleContact = (contactId: string) => {
    const newSelected = new Set(selectedContactIds);
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId);
    } else {
      newSelected.add(contactId);
    }
    setSelectedContactIds(newSelected);
  };

  const handleSubmit = async () => {
    if (selectedContactIds.size === 0) {
      setError("Please select at least one contact");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError("You must be logged in");
        setIsSubmitting(false);
        return;
      }

      // Get the highest position in the loop group
      const { data: existingPositions } = await supabase
        .from("person_loop_groups")
        .select("position")
        .eq("loop_group_id", loopGroupId)
        .order("position", { ascending: false })
        .limit(1);

      let nextPosition = existingPositions && existingPositions.length > 0
        ? existingPositions[0].position + 1
        : 0;

      // Insert new contacts into person_loop_groups
      const inserts = Array.from(selectedContactIds).map((personId) => ({
        person_id: personId,
        loop_group_id: loopGroupId,
        position: nextPosition++,
      }));

      const { error: insertError } = await supabase
        .from("person_loop_groups")
        .insert(inserts);

      if (insertError) {
        console.error("Error adding contacts to loop group:", insertError);
        setError("Failed to add contacts. Please try again.");
        setIsSubmitting(false);
        return;
      }

      // Success!
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Error submitting contacts:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Filter contacts based on search query and exclude already added ones
  const availableContacts = allContacts.filter(
    (contact) => !existingContactIds.has(contact.id)
  );

  const filteredContacts = searchQuery
    ? availableContacts.filter((contact) =>
        contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.phone?.includes(searchQuery)
      )
    : availableContacts;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Add Contacts
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              to {loopGroupName}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <Input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={loading || isSubmitting}
              className="pl-9 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
            />
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-280px)]">
          {error && (
            <div className="p-4 mx-6 mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400 dark:text-gray-500" />
            </div>
          ) : availableContacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-4 mb-4">
                <Check className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                All Contacts Added
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                All your contacts are already in this loop group!
              </p>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <Search className="h-8 w-8 text-gray-400 dark:text-gray-500 mb-4" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No contacts found matching "{searchQuery}"
              </p>
            </div>
          ) : (
            <div className="p-6 space-y-2">
              {filteredContacts.map((contact) => {
                const isSelected = selectedContactIds.has(contact.id);

                return (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => toggleContact(contact.id)}
                    disabled={isSubmitting}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 disabled:opacity-50",
                      isSelected
                        ? "bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500 dark:border-blue-400"
                        : "bg-gray-50 dark:bg-gray-900 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600"
                    )}
                  >
                    {/* Checkbox */}
                    <div
                      className={cn(
                        "flex-shrink-0 h-5 w-5 rounded border-2 flex items-center justify-center transition-colors",
                        isSelected
                          ? "bg-blue-500 dark:bg-blue-600 border-blue-500 dark:border-blue-600"
                          : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3 text-white" />}
                    </div>

                    {/* Avatar */}
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={contact.photo_url || ""} />
                      <AvatarFallback
                        className={cn(
                          "bg-gradient-to-br text-white font-semibold text-sm",
                          getGradient(contact.name)
                        )}
                      >
                        {getInitials(contact.name)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Contact Info */}
                    <div className="flex-1 min-w-0 text-left">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">
                        {contact.name}
                      </h3>
                      {(contact.email || contact.phone) && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight mt-0.5">
                          {contact.email || contact.phone}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {availableContacts.length > 0 && (
          <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {selectedContactIds.size} contact{selectedContactIds.size !== 1 ? "s" : ""} selected
            </p>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="border-gray-300 dark:border-gray-600"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || selectedContactIds.size === 0}
                className="bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 min-w-[100px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>Add ({selectedContactIds.size})</>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
