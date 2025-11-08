"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Loader2 } from "lucide-react";
import { IconSelector } from "@/components/icon-selector";
import { createClient } from "@/lib/supabase/client";
import type { LoopGroup } from "@/types/database.types";

// Predefined color palette
const COLOR_PALETTE = [
  { name: "Purple", value: "#8B5CF6" },
  { name: "Blue", value: "#3B82F6" },
  { name: "Green", value: "#10B981" },
  { name: "Yellow", value: "#F59E0B" },
  { name: "Red", value: "#EF4444" },
  { name: "Pink", value: "#EC4899" },
  { name: "Indigo", value: "#6366F1" },
  { name: "Teal", value: "#14B8A6" },
  { name: "Orange", value: "#F97316" },
  { name: "Cyan", value: "#06B6D4" },
];

interface LoopGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  loopGroup?: LoopGroup | null; // If provided, we're editing
}

export function LoopGroupModal({
  isOpen,
  onClose,
  onSuccess,
  loopGroup,
}: LoopGroupModalProps) {
  const [name, setName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("Folder");
  const [selectedColor, setSelectedColor] = useState(COLOR_PALETTE[0].value);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!loopGroup;

  // Initialize form with existing data when editing
  useEffect(() => {
    if (loopGroup) {
      setName(loopGroup.name);
      setSelectedIcon(loopGroup.icon_name);
      setSelectedColor(loopGroup.color);
    } else {
      // Reset form when creating new
      setName("");
      setSelectedIcon("Folder");
      setSelectedColor(COLOR_PALETTE[0].value);
    }
    setError(null);
  }, [loopGroup, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Please enter a group name");
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

      if (isEditing && loopGroup) {
        // Update existing loop group
        const { error: updateError } = await supabase
          .from("loop_groups")
          .update({
            name: name.trim(),
            icon_name: selectedIcon,
            color: selectedColor,
            updated_at: new Date().toISOString(),
          })
          .eq("id", loopGroup.id)
          .eq("user_id", user.id);

        if (updateError) {
          console.error("Error updating loop group:", updateError);
          setError("Failed to update group. Please try again.");
          setIsSubmitting(false);
          return;
        }
      } else {
        // Get the highest position to append new group
        const { data: existingGroups } = await supabase
          .from("loop_groups")
          .select("position")
          .eq("user_id", user.id)
          .order("position", { ascending: false })
          .limit(1);

        const nextPosition = existingGroups && existingGroups.length > 0
          ? existingGroups[0].position + 1
          : 0;

        // Create new loop group
        const { error: insertError } = await supabase
          .from("loop_groups")
          .insert({
            user_id: user.id,
            name: name.trim(),
            icon_name: selectedIcon,
            color: selectedColor,
            position: nextPosition,
          });

        if (insertError) {
          console.error("Error creating loop group:", insertError);
          setError("Failed to create group. Please try again.");
          setIsSubmitting(false);
          return;
        }
      }

      // Success!
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Error submitting loop group:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEditing ? "Edit Loop Group" : "Create Loop Group"}
          </h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="p-6 space-y-6">
            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Group Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-gray-900 dark:text-white">
                Group Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="e.g., Family, Work, Friends"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
                className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                maxLength={50}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {name.length}/50 characters
              </p>
            </div>

            {/* Color Picker */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-900 dark:text-white">
                Choose a Color
              </Label>
              <div className="grid grid-cols-5 gap-2">
                {COLOR_PALETTE.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setSelectedColor(color.value)}
                    disabled={isSubmitting}
                    className="relative aspect-square rounded-lg transition-all duration-200 hover:scale-105 disabled:opacity-50"
                    style={{
                      backgroundColor: color.value,
                      boxShadow: selectedColor === color.value
                        ? `0 0 0 3px ${color.value}40`
                        : undefined,
                    }}
                    title={color.name}
                  >
                    {selectedColor === color.value && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-6 w-6 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                          <div className="h-3 w-3 rounded-full bg-white"></div>
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Icon Selector */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-900 dark:text-white">
                Choose an Icon
              </Label>
              <IconSelector
                selectedIcon={selectedIcon}
                onSelectIcon={setSelectedIcon}
                color={selectedColor}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="border-gray-300 dark:border-gray-600"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="min-w-[100px]"
              style={{
                backgroundColor: selectedColor,
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>{isEditing ? "Update" : "Create"}</>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
