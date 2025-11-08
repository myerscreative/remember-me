"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Archive,
  ArchiveRestore,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface ArchiveContactDialogProps {
  contactId: string;
  contactName: string;
  isArchived: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ArchiveContactDialog({
  contactId,
  contactName,
  isArchived,
  onSuccess,
  onCancel,
}: ArchiveContactDialogProps) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  const handleArchive = async () => {
    if (!isArchived && reason.trim().length < 5) {
      alert("Please provide a brief reason for archiving (at least 5 characters)");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();

      if (isArchived) {
        // Unarchive
        const { error } = await supabase
          .from("persons")
          .update({
            archived: false,
            archived_at: null,
            archived_reason: null,
          })
          .eq("id", contactId);

        if (error) throw error;
      } else {
        // Archive
        const { error } = await supabase
          .from("persons")
          .update({
            archived: true,
            archived_at: new Date().toISOString(),
            archived_reason: reason.trim(),
          })
          .eq("id", contactId);

        if (error) throw error;
      }

      setShowDialog(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error archiving contact:", error);
      alert("Failed to archive contact. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!showDialog) {
    return (
      <Button
        variant={isArchived ? "outline" : "ghost"}
        size="sm"
        onClick={() => setShowDialog(true)}
        className={isArchived ? "text-green-600 hover:text-green-700 border-green-200" : "text-gray-600 hover:text-gray-700"}
      >
        {isArchived ? (
          <>
            <ArchiveRestore className="h-4 w-4 mr-2" />
            Unarchive
          </>
        ) : (
          <>
            <Archive className="h-4 w-4 mr-2" />
            Archive
          </>
        )}
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {isArchived ? "Unarchive Contact" : "Archive Contact"}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setShowDialog(false);
              onCancel?.();
            }}
            className="h-8 w-8"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            {isArchived ? (
              <>
                Are you sure you want to unarchive <strong>{contactName}</strong>?
                This will restore them to your active contacts.
              </>
            ) : (
              <>
                Archiving preserves the memory and story of <strong>{contactName}</strong> without
                cluttering your active contacts. You can always unarchive them later.
              </>
            )}
          </p>

          {!isArchived && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Why are you archiving this contact?
              </label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Connection naturally ended, Moved to different industry, No longer relevant..."
                className="min-h-[100px]"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-2">
                This helps you remember the context when you look back later.
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setShowDialog(false);
              onCancel?.();
            }}
            disabled={loading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleArchive}
            disabled={loading}
            className={isArchived ? "flex-1 bg-green-600 hover:bg-green-700" : "flex-1 bg-orange-600 hover:bg-orange-700"}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                {isArchived ? "Unarchiving..." : "Archiving..."}
              </div>
            ) : (
              <>
                {isArchived ? (
                  <>
                    <ArchiveRestore className="h-4 w-4 mr-2" />
                    Unarchive
                  </>
                ) : (
                  <>
                    <Archive className="h-4 w-4 mr-2" />
                    Archive Contact
                  </>
                )}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
