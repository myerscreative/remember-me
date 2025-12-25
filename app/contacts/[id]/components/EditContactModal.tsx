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
    company: "",
    jobTitle: "",
    birthday: "",
    lastContactDate: "",
    lastContactMethod: "",
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
        company: contact.company || "",
        jobTitle: contact.job_title || contact.jobTitle || "",
        birthday: contact.birthday || "",
        lastContactDate: contact.last_interaction_date?.split('T')[0] || contact.last_contact_date?.split('T')[0] || "",
        lastContactMethod: contact.last_contact_method || "",
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
    const updates: Record<string, string | null> = {
      first_name: formData.firstName.trim(),
      last_name: formData.lastName.trim() || null,
      name: fullName,
      email: formData.email.trim() || null,
      phone: formData.phone.trim() || null,
      linkedin: formData.linkedin.trim() || null,
      company: formData.company.trim() || null,
      job_title: formData.jobTitle.trim() || null,
      birthday: formData.birthday || null,
      last_interaction_date: formData.lastContactDate || null,
      last_contact_method: formData.lastContactMethod || null,
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="Company Name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job Title</Label>
              <Input
                id="jobTitle"
                value={formData.jobTitle}
                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                placeholder="Job Title"
              />
            </div>
          </div>
          
          <div className="space-y-2">
             <Label htmlFor="birthday">Birthday</Label>
             <Input
               id="birthday"
               type="date"
               value={formData.birthday}
               onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
             />
          </div>

          {/* Last Contact Section */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Last Contact (for backfilling)</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lastContactDate">Date</Label>
                <Input
                  id="lastContactDate"
                  type="date"
                  value={formData.lastContactDate}
                  onChange={(e) => setFormData({ ...formData, lastContactDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastContactMethod">Method</Label>
                <select
                  id="lastContactMethod"
                  value={formData.lastContactMethod}
                  onChange={(e) => setFormData({ ...formData, lastContactMethod: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select method...</option>
                  <option value="call">Call</option>
                  <option value="email">Email</option>
                  <option value="text">Text</option>
                  <option value="meeting">Meeting</option>
                </select>
              </div>
            </div>
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
