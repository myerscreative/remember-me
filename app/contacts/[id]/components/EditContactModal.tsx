"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { formatPhoneNumber } from "@/lib/utils";

interface EditContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: any;
  onSuccess: () => void;
}

export function EditContactModal({ isOpen, onClose, contact, onSuccess }: EditContactModalProps) {
  const [isSaving, setIsSaving] = useState(false);

  // Form State - only fields that exist in the database
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    linkedin: "",
  });

  // Load initial data when contact changes or modal opens
  useEffect(() => {
    if (contact && isOpen) {
      setFormData({
        firstName: contact.first_name || contact.firstName || "",
        lastName: contact.last_name || contact.lastName || "",
        email: contact.email || "",
        phone: contact.phone || "",
        linkedin: contact.linkedin || "",
      });
    }
  }, [contact, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName.trim()) {
      toast.error("First name is required");
      return;
    }

    setIsSaving(true);

    const fullName = formData.lastName.trim()
      ? `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim()
      : formData.firstName.trim();

    // Only include fields that exist in the persons table
    const updates = {
      first_name: formData.firstName.trim(),
      last_name: formData.lastName.trim() || null,
      name: fullName,
      email: formData.email.trim() || null,
      phone: formData.phone.trim() || null,
      linkedin: formData.linkedin.trim() || null,
    };

    try {
      const supabase = createClient();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("persons")
        .update(updates)
        .eq("id", contact.id);

      if (error) throw error;

      toast.success("Contact updated successfully");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error updating contact:", error);
      toast.error("Failed to update contact");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Contact Info</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name <span className="text-red-500">*</span></Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="First Name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Last Name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: formatPhoneNumber(e.target.value) })}
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkedin">LinkedIn URL</Label>
            <Input
              id="linkedin"
              value={formData.linkedin}
              onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
              placeholder="linkedin.com/in/username"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
