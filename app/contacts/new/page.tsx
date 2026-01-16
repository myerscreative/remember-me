"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Mic, Loader2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { PersonInsert } from "@/types/database.types";
import { VoiceEntryModalEnhanced } from "@/components/voice-entry-modal-enhanced";
import { formatPhoneNumber } from "@/lib/utils";
import toast, { Toaster } from "react-hot-toast";

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

export default function NewContactPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    whereMet: "",
    introducedBy: "",
    whyStayInContact: "",
    whatInteresting: "",
    whatsImportant: "",
    firstImpression: "",
    memorableMoment: "",
    tags: "",
    email: "",
    phone: "",
    linkedin: "",
    interests: "",
    skills: "",
    company: "",
    jobTitle: "",
    birthday: "",
    notes: "",
    familyMembers: [] as Array<{ name: string; relationship: string }>,
    misc: "",
  });

  // Get user ID on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    fetchUser();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName.trim()) {
      toast.error("Please enter a first name");
      return;
    }

    setIsSaving(true);

    try {
      let supabase;
      try {
        supabase = createClient();
      } catch (configError) {
        console.error("Supabase configuration error:", configError);
        toast.error("Supabase is not configured. Please check your environment variables.");
        setIsSaving(false);
        return;
      }
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        // Redirect to login instead of throwing error
        router.push("/login?redirect=/contacts/new");
        return;
      }

      // Combine first and last name for full name
      const fullName = formData.lastName.trim() 
        ? `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim()
        : formData.firstName.trim();

      // Prepare person data with separate first_name and last_name fields
      const personData: PersonInsert = {
        user_id: user.id,
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim() || null,
        name: fullName, // Keep for backward compatibility
        family_members: formData.familyMembers.length > 0 ? formData.familyMembers : null,
        notes: formData.misc.trim() || null, // Map misc to notes field
        where_met: formData.whereMet.trim() || null,
        who_introduced: formData.introducedBy.trim() || null,
        why_stay_in_contact: formData.whyStayInContact.trim() || null,
        what_found_interesting: formData.whatInteresting.trim() || null,
        most_important_to_them: formData.whatsImportant.trim() || null,
        // Temporarily commented out until schema cache refreshes
        // first_impression: formData.firstImpression.trim() || null,
        // memorable_moment: formData.memorableMoment.trim() || null,
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        linkedin: formData.linkedin.trim() || null,
        interests: formData.interests.split(',').map(s => s.trim()).filter(Boolean),
      };

      // Insert person
      const { data: newPerson, error: personError } = await (supabase as any)
        .from("persons")
        .insert(personData)
        .select()
        .single();

      if (personError) {
        console.error("Supabase insert error:", personError);
        console.error("Error details:", {
          message: personError.message,
          code: personError.code,
          details: personError.details,
          hint: personError.hint,
        });
        console.error("Data being inserted:", personData);
        throw personError;
      }

      // Handle tags if provided
      if (formData.tags.trim() && newPerson) {
        const tagNames = formData.tags
          .split(",")
          .map((tag: any) => tag.trim())
          .filter((tag: any) => tag.length > 0);

        if (tagNames.length > 0) {
          // Get or create tags
          const tagIds: string[] = [];
          
          for (const tagName of tagNames) {
            // Check if tag exists
            const { data: existingTag } = await (supabase as any)
              .from("tags")
              .select("id")
              .eq("user_id", user.id)
              .eq("name", tagName)
              .single();

            let tagId: string;

            if (existingTag) {
              tagId = existingTag.id;
            } else {
              // Create new tag
              const { data: newTag, error: tagError } = await (supabase as any)
                .from("tags")
                .insert({
                  user_id: user.id,
                  name: tagName,
                  color: "#8b5cf6", // Default purple color
                })
                .select("id")
                .single();

              if (tagError) {
                console.error("Error creating tag:", tagError);
                continue;
              }
              tagId = newTag.id;
            }

            tagIds.push(tagId);
          }

          // Link person to tags
          if (tagIds.length > 0) {
            const personTagInserts = tagIds.map(tagId => ({
              person_id: newPerson.id,
              tag_id: tagId,
            }));

            const { error: linkError } = await (supabase as any)
              .from("person_tags")
              .insert(personTagInserts);

            if (linkError) {
              console.error("Error linking tags:", linkError);
            }
          }
        }
      }

      // Navigate to contacts page
      router.push("/");
    } catch (error) {
      console.error("Error saving contact:", error);
      console.error("Full error object:", JSON.stringify(error, null, 2));
      
      // Provide more detailed error information
      let errorMessage = "Unknown error";
      let errorDetails = "";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        // Handle Supabase errors
        if ('message' in error) {
          errorMessage = String(error.message);
        }
        if ('code' in error) {
          errorDetails += `\nCode: ${error.code}`;
        }
        if ('details' in error) {
          errorDetails += `\nDetails: ${error.details}`;
        }
        if ('hint' in error) {
          errorDetails += `\nHint: ${error.hint}`;
        }
      }
      
      toast.error(`Error saving contact: ${errorMessage}${errorDetails}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleVoiceEntry = () => {
    setIsVoiceModalOpen(true);
  };

  const handleVoiceDataApply = (data: ParsedContactData) => {
    // Parse name into first and last name
    let parsedFirstName = "";
    let parsedLastName = "";
    if (data.name) {
      const nameParts = data.name.trim().split(/\s+/);
      parsedFirstName = nameParts[0] || "";
      parsedLastName = nameParts.slice(1).join(" ") || "";
    }

    // Merge voice data into form, preserving existing data where fields are already filled
    setFormData((prev) => ({
      firstName: prev.firstName || parsedFirstName || "",
      lastName: prev.lastName || parsedLastName || "",
      email: prev.email || data.email || "",
      phone: prev.phone || (data.phone ? formatPhoneNumber(data.phone) : ""),
      linkedin: prev.linkedin || data.linkedin || "",
      company: prev.company || data.company || "",
      jobTitle: prev.jobTitle || data.jobTitle || "",
      whereMet: prev.whereMet || data.whereMet || "",
      introducedBy: prev.introducedBy || data.introducedBy || "",
      whyStayInContact: prev.whyStayInContact || data.whyStayInContact || "",
      whatInteresting: prev.whatInteresting || data.whatInteresting || "",
      whatsImportant: prev.whatsImportant || data.whatsImportant || "",
      firstImpression: prev.firstImpression || "",
      memorableMoment: prev.memorableMoment || "",
      interests: prev.interests || (data.interests ? data.interests.join(", ") : ""),
      skills: prev.skills || (data.skills ? data.skills.join(", ") : ""),
      birthday: prev.birthday || data.birthday || "",
      tags: prev.tags || (data.tags ? (Array.isArray(data.tags) ? data.tags.join(", ") : data.tags) : ""),
      familyMembers: prev.familyMembers.length > 0 ? prev.familyMembers : (data.familyMembers || []),
      notes: prev.notes || data.notes || "",
      misc: prev.misc || data.notes || "", // Keep misc for backward compat
    }));
  };

  const handleSelectExistingContact = (contactId: string) => {
    // Navigate to the existing contact for update
    router.push(`/contacts/${contactId}`);
  };

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900 overflow-hidden">
      <Toaster position="top-center" />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between pt-4 pb-4 md:pt-6 md:pb-6">
            <Link href="/">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <X className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </Button>
            </Link>
            <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">New Contact</h1>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>

          <form onSubmit={handleSubmit} id="contact-form" className="space-y-6 pb-40 md:pb-40">
            {/* Quick Voice Entry Button */}
            <Button
              type="button"
              onClick={handleVoiceEntry}
              className="w-full h-14 md:h-16 rounded-xl bg-linear-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold text-base md:text-lg shadow-lg"
            >
              <div className="flex items-center justify-between w-full px-4">
                <div className="flex items-center gap-2">
                  <Mic className="h-5 w-5 md:h-6 md:w-6" />
                  <span>Quick Voice Entry</span>
                </div>
                <span className="text-white/80 text-sm font-normal">
                  "I just met Sarah at the AI Summit..."
                </span>
              </div>
            </Button>

            {/* Form Fields */}
            <div className="space-y-6">
              {/* First Name */}
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm md:text-base text-gray-700 dark:text-gray-300 font-medium">
                  First Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="firstName"
                  required
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  placeholder="First name"
                  className="h-11 md:h-12 rounded-lg border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white"
                  disabled={isSaving}
                />
              </div>

              {/* Last Name */}
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm md:text-base text-gray-700 dark:text-gray-300 font-medium">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  placeholder="Last name (optional)"
                  className="h-11 md:h-12 rounded-lg border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white"
                  disabled={isSaving}
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm md:text-base text-gray-700 dark:text-gray-300 font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="email@example.com"
                  className="h-11 md:h-12 rounded-lg border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white"
                  disabled={isSaving}
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm md:text-base text-gray-700 dark:text-gray-300 font-medium">
                  Phone
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => {
                    const formatted = formatPhoneNumber(e.target.value);
                    setFormData({ ...formData, phone: formatted });
                  }}
                  placeholder="+1 (555) 123-4567"
                  className="h-11 md:h-12 rounded-lg border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white"
                  disabled={isSaving}
                />
              </div>

              {/* LinkedIn */}
              <div className="space-y-2">
                <Label htmlFor="linkedin" className="text-sm md:text-base text-gray-700 dark:text-gray-300 font-medium">
                  LinkedIn
                </Label>
                <Input
                  id="linkedin"
                  value={formData.linkedin}
                  onChange={(e) =>
                    setFormData({ ...formData, linkedin: e.target.value })
                  }
                  placeholder="linkedin.com/in/username"
                  className="h-11 md:h-12 rounded-lg border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white"
                  disabled={isSaving}
                />
              </div>

              {/* Company & Job Title */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="company" className="text-sm md:text-base text-gray-700 dark:text-gray-300 font-medium">
                    Company
                  </Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) =>
                      setFormData({ ...formData, company: e.target.value })
                    }
                    placeholder="Company Name"
                    className="h-11 md:h-12 rounded-lg border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white"
                    disabled={isSaving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jobTitle" className="text-sm md:text-base text-gray-700 dark:text-gray-300 font-medium">
                    Job Title
                  </Label>
                  <Input
                    id="jobTitle"
                    value={formData.jobTitle}
                    onChange={(e) =>
                      setFormData({ ...formData, jobTitle: e.target.value })
                    }
                    placeholder="Job Title"
                    className="h-11 md:h-12 rounded-lg border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white"
                    disabled={isSaving}
                  />
                </div>
              </div>

              {/* Where did we meet? */}
              <div className="space-y-2">
                <Label htmlFor="whereMet" className="text-sm md:text-base text-gray-700 dark:text-gray-300 font-medium">
                  Where did we meet?
                </Label>
                <Input
                  id="whereMet"
                  value={formData.whereMet}
                  onChange={(e) =>
                    setFormData({ ...formData, whereMet: e.target.value })
                  }
                  placeholder="e.g., AI Summit, coffee shop, Zoom call"
                  className="h-11 md:h-12 rounded-lg border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white"
                  disabled={isSaving}
                />
              </div>

              {/* Who introduced us? */}
              <div className="space-y-2">
                <Label htmlFor="introducedBy" className="text-sm md:text-base text-gray-700 dark:text-gray-300 font-medium">
                  Who introduced us?
                </Label>
                <Input
                  id="introducedBy"
                  value={formData.introducedBy}
                  onChange={(e) =>
                    setFormData({ ...formData, introducedBy: e.target.value })
                  }
                  placeholder="Leave blank if met directly"
                  className="h-11 md:h-12 rounded-lg border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white"
                  disabled={isSaving}
                />
              </div>

              {/* First Impression */}
              <div className="space-y-2">
                <Label htmlFor="firstImpression" className="text-sm md:text-base text-gray-700 dark:text-gray-300 font-medium">
                  First impression
                </Label>
                <Textarea
                  id="firstImpression"
                  value={formData.firstImpression}
                  onChange={(e) =>
                    setFormData({ ...formData, firstImpression: e.target.value })
                  }
                  placeholder="What was your immediate impression when you first met?"
                  className="min-h-[80px] rounded-lg border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white resize-none"
                  disabled={isSaving}
                />
              </div>

              {/* Memorable Moment */}
              <div className="space-y-2">
                <Label htmlFor="memorableMoment" className="text-sm md:text-base text-gray-700 dark:text-gray-300 font-medium">
                  What made it memorable?
                </Label>
                <Textarea
                  id="memorableMoment"
                  value={formData.memorableMoment}
                  onChange={(e) =>
                    setFormData({ ...formData, memorableMoment: e.target.value })
                  }
                  placeholder="What made this first conversation or meeting memorable?"
                  className="min-h-[80px] rounded-lg border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white resize-none"
                  disabled={isSaving}
                />
              </div>

              {/* Why stay in contact? */}
              <div className="space-y-2">
                <Label htmlFor="whyStayInContact" className="text-sm md:text-base text-gray-700 dark:text-gray-300 font-medium">
                  Why stay in contact?
                </Label>
                <Textarea
                  id="whyStayInContact"
                  value={formData.whyStayInContact}
                  onChange={(e) =>
                    setFormData({ ...formData, whyStayInContact: e.target.value })
                  }
                  placeholder="What's the value of this relationship?"
                  className="min-h-[100px] rounded-lg border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white resize-none"
                  disabled={isSaving}
                />
              </div>

              {/* What did I find interesting? */}
              <div className="space-y-2">
                <Label htmlFor="whatInteresting" className="text-sm md:text-base text-gray-700 dark:text-gray-300 font-medium">
                  What did I find interesting?
                </Label>
                <Textarea
                  id="whatInteresting"
                  value={formData.whatInteresting}
                  onChange={(e) =>
                    setFormData({ ...formData, whatInteresting: e.target.value })
                  }
                  placeholder="What stood out about them?"
                  className="min-h-[100px] rounded-lg border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white resize-none"
                  disabled={isSaving}
                />
              </div>

              {/* What's important to them? */}
              <div className="space-y-2">
                <Label htmlFor="whatsImportant" className="text-sm md:text-base text-gray-700 dark:text-gray-300 font-medium">
                  What's important to them?
                </Label>
                <Textarea
                  id="whatsImportant"
                  value={formData.whatsImportant}
                  onChange={(e) =>
                    setFormData({ ...formData, whatsImportant: e.target.value })
                  }
                  placeholder="Their priorities, values, goals..."
                  className="min-h-[100px] rounded-lg border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white resize-none"
                  disabled={isSaving}
                />
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label htmlFor="tags" className="text-sm md:text-base text-gray-700 dark:text-gray-300 font-medium">
                  Tags
                </Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData({ ...formData, tags: e.target.value })
                  }
                  placeholder="e.g., Investor, Friend, AI Summit (comma-separated)"
                  className="h-11 md:h-12 rounded-lg border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white"
                  disabled={isSaving}
                />
              </div>

              {/* Family Members */}
              <div className="space-y-2">
                <Label className="text-sm md:text-base text-gray-700 dark:text-gray-300 font-medium">
                  Family Members
                </Label>
                <div className="space-y-3">
                  {formData.familyMembers.map((member, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={member.name}
                        onChange={(e) => {
                          const updated = [...formData.familyMembers];
                          updated[index] = { ...member, name: e.target.value };
                          setFormData({ ...formData, familyMembers: updated });
                        }}
                        placeholder="Name"
                        className="h-11 md:h-12 rounded-lg border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white flex-1"
                        disabled={isSaving}
                      />
                      <Input
                        value={member.relationship}
                        onChange={(e) => {
                          const updated = [...formData.familyMembers];
                          updated[index] = { ...member, relationship: e.target.value };
                          setFormData({ ...formData, familyMembers: updated });
                        }}
                        placeholder="Relationship"
                        className="h-11 md:h-12 rounded-lg border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white flex-1"
                        disabled={isSaving}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const updated = formData.familyMembers.filter((_, i) => i !== index);
                          setFormData({ ...formData, familyMembers: updated });
                        }}
                        className="h-11 md:h-12 w-11 md:w-12 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        disabled={isSaving}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        familyMembers: [...formData.familyMembers, { name: "", relationship: "" }]
                      });
                    }}
                    className="w-full h-11 md:h-12 rounded-lg border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                    disabled={isSaving}
                  >
                    + Add Family Member
                  </Button>
                </div>
              </div>

              {/* Misc Notes */}
              <div className="space-y-2">
                <Label htmlFor="misc" className="text-sm md:text-base text-gray-700 dark:text-gray-300 font-medium">
                  Additional Notes
                </Label>
                <Textarea
                  id="misc"
                  value={formData.misc}
                  onChange={(e) =>
                    setFormData({ ...formData, misc: e.target.value })
                  }
                  placeholder="Any other details or notes you want to remember..."
                  className="min-h-[100px] rounded-lg border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white resize-none"
                  disabled={isSaving}
                />
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Voice Entry Modal */}
      <VoiceEntryModalEnhanced
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onApply={handleVoiceDataApply}
        onSelectExistingContact={handleSelectExistingContact}
        userId={userId}
      />

      {/* Save Contact Button - Mobile */}
      <div className="fixed bottom-16 left-0 right-0 z-[60] bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 md:hidden shadow-lg">
        <Button
          type="submit"
          form="contact-form"
          className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Contact"
          )}
        </Button>
      </div>

      {/* Save Contact Button - Desktop */}
      <div className="hidden md:block fixed bottom-0 left-0 right-0 z-[60] bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6 shadow-lg" style={{ marginLeft: '16rem' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button
            type="submit"
            form="contact-form"
            className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Contact"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

