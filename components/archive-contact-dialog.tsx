"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Archive,
  ArchiveRestore,
  X,
} from "lucide-react";

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
      // Use API route that bypasses PostgREST schema cache
      const response = await fetch("/api/archive-contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contactId,
          archived: !isArchived, // Archive if not archived, unarchive if archived
          archivedReason: isArchived ? null : reason.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to archive contact");
      }

      setShowDialog(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error archiving contact:", error);
      alert(error instanceof Error ? error.message : "Failed to archive contact. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!showDialog) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowDialog(true)}
        className={isArchived 
          ? "text-green-600 hover:text-green-700 border-green-200 dark:border-green-800 dark:text-green-400 w-full" 
          : "text-red-600 hover:text-red-700 border-red-200 dark:border-red-900/50 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 w-full"
        }
      >
        {isArchived ? (
          <>
            <ArchiveRestore className="h-4 w-4 mr-2" />
            Unarchive Contact
          </>
        ) : (
          <>
            <Archive className="h-4 w-4 mr-2" />
            Archive Contact
          </>
        )}
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
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
