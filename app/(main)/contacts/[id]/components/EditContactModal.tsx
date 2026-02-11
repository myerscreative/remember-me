"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { formatPhoneNumber } from "@/lib/utils";
import { FREQUENCY_PRESETS } from "@/lib/relationship-health";


interface EditContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: any;
  onSuccess: () => void;
}

export function EditContactModal({ isOpen, onClose, contact, onSuccess }: EditContactModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
    targetFrequencyDays: 30,
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
        targetFrequencyDays: contact.target_frequency_days || 30,
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
    const updates: Record<string, any> = {
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
      target_frequency_days: formData.targetFrequencyDays,
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
      <DialogContent className="sm:max-w-[600px] w-[calc(100%-24px)] max-h-[95vh] overflow-y-auto p-4 sm:p-6 rounded-2xl">
        <DialogHeader>
          <DialogTitle>Edit Contact Info</DialogTitle>
          <DialogDescription>
            Update the details for this contact.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-2 pb-24">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name <span className="text-red-500">*</span></Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="First Name"
                  className="h-11 px-4 text-base capitalize"
                />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Last Name"
                  className="h-11 px-4 text-base capitalize"
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
              className="h-11 px-4 text-base"
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
              className="h-11 px-4 text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkedin">LinkedIn URL</Label>
            <Input
              id="linkedin"
              value={formData.linkedin}
              onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
              placeholder="linkedin.com/in/username"
              className="h-11 px-4 text-base"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Company Name"
                  className="h-11 px-4 text-base"
                />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job Title</Label>
                <Input
                  id="jobTitle"
                  value={formData.jobTitle}
                  onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                  placeholder="Job Title"
                  className="h-11 px-4 text-base"
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
               className="h-11 px-4 text-base w-full max-w-[200px] min-w-0"
             />
          </div>

          {/* Last Contact Section */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Last Contact (for backfilling)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lastContactDate">Date</Label>
                  <Input
                    id="lastContactDate"
                    type="date"
                    value={formData.lastContactDate}
                    onChange={(e) => setFormData({ ...formData, lastContactDate: e.target.value })}
                    className="h-11 px-4 text-base w-full max-w-[200px] min-w-0"
                  />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastContactMethod">Method</Label>
                  <select
                    id="lastContactMethod"
                    value={formData.lastContactMethod}
                    onChange={(e) => setFormData({ ...formData, lastContactMethod: e.target.value })}
                    className="w-full h-11 px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-0"
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

          <div className="space-y-2">
            <Label htmlFor="targetFrequencyDays">Follow-up Frequency</Label>
            <select
              id="targetFrequencyDays"
              value={formData.targetFrequencyDays}
              onChange={(e) => setFormData({ ...formData, targetFrequencyDays: parseInt(e.target.value) })}
              className="w-full h-11 px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-0"
            >
              {FREQUENCY_PRESETS.map((preset) => (
                <option key={preset.days} value={preset.days}>
                  {preset.label} ({preset.days} days)
                </option>
              ))}
            </select>
          </div>



      <div className="flex flex-col gap-4 w-full pt-4 border-t border-gray-100 dark:border-gray-800">
        <div className="flex flex-col-reverse sm:flex-row justify-between items-center w-full gap-4">
            {!showDeleteConfirm ? (
              <Button 
                type="button" 
                variant="destructive" 
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isSaving}
              >
                Delete Contact
              </Button>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3 items-center bg-red-50 dark:bg-red-950/20 p-4 rounded-xl border border-red-100 dark:border-red-900/30 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex-1">
                  <p className="text-red-800 dark:text-red-400 text-xs font-bold uppercase tracking-tight mb-1">Warning: Irreversible Action</p>
                  <p className="text-red-600 dark:text-red-500 text-[11px] leading-tight">Delete everything for this contact?</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white h-9 px-4"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isSaving}
                  >
                    Keep
                  </Button>
                  <Button 
                    type="button" 
                    variant="destructive" 
                    size="sm"
                    className="h-9 px-4 shadow-lg shadow-red-500/20"
                    onClick={async () => {
                      setIsSaving(true);
                      try {
                        const supabase = createClient();
                        const { error } = await (supabase as any)
                          .from("persons")
                          .delete()
                          .eq("id", contact.id);

                        if (error) throw error;

                        toast.success("Contact deleted");
                        onSuccess();
                        onClose();
                        window.location.href = '/'; 
                      } catch (err: any) {
                        console.error("Delete error:", err);
                        toast.error("Failed to delete contact");
                        setIsSaving(false);
                        setShowDeleteConfirm(false);
                      }
                    }} 
                    disabled={isSaving}
                  >
                    Confirm Delete
                  </Button>
                </div>
              </div>
            )}

            {!showDeleteConfirm && (
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button type="button" variant="outline" onClick={onClose} disabled={isSaving} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving} className="w-full sm:w-auto">
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
