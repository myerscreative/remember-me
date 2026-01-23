"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Mic, Loader2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import toast, { Toaster } from "react-hot-toast";

export default function EditContactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    birthday: "",
    whereMet: "",
    introducedBy: "",
    whyStayInContact: "",
    whatInteresting: "",
    whatsImportant: "",
    profession: "",
    familyNotes: "",
    hobbies: "",
    tags: "",
  });

  // Fetch contact data from Supabase
  useEffect(() => {
    async function fetchContact() {
      try {
        const supabase = createClient();

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          toast.error("Please log in to edit contacts");
          router.push("/login?redirect=/contacts/" + id + "/edit");
          return;
        }

        // Fetch person data
        const { data: person, error: personError } = await (supabase as any)
          .from("persons")
          .select("*")
          .eq("id", id)
          .eq("user_id", user.id)
          .single();

        if (personError) {
          toast.error("Failed to load contact");
          console.error("Error fetching contact:", personError);
          router.push("/contacts");
          return;
        }

        if (!person) {
          toast.error("Contact not found");
          router.push("/contacts");
          return;
        }

        // Fetch tags for this person
        const { data: personTags } = await (supabase as any)
          .from("person_tags")
          .select("tag_id, tags(name)")
          .eq("person_id", id);

        const tagNames = personTags?.map((pt: any) => pt.tags?.name).filter(Boolean) || [];

        // Populate form with existing data
        setFormData({
          firstName: person.first_name || "",
          lastName: person.last_name || "",
          email: person.email || "",
          phone: person.phone || "",
          birthday: person.birthday || "",
          whereMet: person.where_met || "", // Note: where_met in DB, whereWeMet in form
          introducedBy: person.who_introduced || "",
          whyStayInContact: person.why_stay_in_contact || "",
          whatInteresting: person.what_found_interesting || "",
          whatsImportant: person.most_important_to_them || "",
          profession: person.job_title || "", // Map job_title to profession
          familyNotes: person.family_notes || "",
          hobbies: person.interests ? person.interests.join(", ") : "", // Map interests array to hobbies string
          tags: tagNames.join(", "),
        });

        setLoading(false);
      } catch (error) {
        console.error("Error fetching contact:", error);
        toast.error("Failed to load contact");
        router.push("/contacts");
      }
    }

    fetchContact();
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const supabase = createClient();

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in to save changes");
        router.push("/login");
        return;
      }

      // Update person data
      const { error: updateError } = await (supabase as any)
        .from("persons")
        .update({
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim() || null,
          email: formData.email.trim() || null,
          phone: formData.phone.trim() || null,
          birthday: formData.birthday || null,
          where_met: formData.whereMet.trim() || null,
          who_introduced: formData.introducedBy.trim() || null,
          why_stay_in_contact: formData.whyStayInContact.trim() || null,
          what_found_interesting: formData.whatInteresting.trim() || null,
          most_important_to_them: formData.whatsImportant.trim() || null,
          job_title: formData.profession.trim() || null,
          family_notes: formData.familyNotes.trim() || null,
          interests: formData.hobbies.split(",").map(s => s.trim()).filter(Boolean),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("user_id", user.id);

      if (updateError) {
        throw updateError;
      }

      // Handle tags update
      if (formData.tags.trim()) {
        const tagArray = formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0);

        // Delete existing tags
        await (supabase as any)
          .from("person_tags")
          .delete()
          .eq("person_id", id);

        // Insert new tags
        for (const tagName of tagArray) {
          // First, get or create the tag
          let { data: existingTag } = await (supabase as any)
            .from("tags")
            .select("id")
            .eq("name", tagName)
            .eq("user_id", user.id)
            .single();

          let tagId;
          if (existingTag) {
            tagId = existingTag.id;
          } else {
            const { data: newTag, error: tagError } = await (supabase as any)
              .from("tags")
              .insert({ name: tagName, user_id: user.id })
              .select()
              .single();

            if (tagError) {
              console.error("Error creating tag:", tagError);
              continue;
            }
            tagId = newTag.id;
          }

          // Create person-tag relationship
          await (supabase as any)
            .from("person_tags")
            .insert({ person_id: id, tag_id: tagId });
        }
      } else {
        // If no tags, delete all existing tags
        await (supabase as any)
          .from("person_tags")
          .delete()
          .eq("person_id", id);
      }

      toast.success("Contact updated successfully!");
      router.push(`/contacts/${id}`);
    } catch (error) {
      console.error("Error updating contact:", error);
      toast.error("Failed to update contact. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleVoiceEntry = () => {
    toast("Voice input coming soon!", {
      icon: "🎤",
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading contact...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-center" />
      <div className="flex flex-col h-screen bg-white dark:bg-gray-900 overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="flex items-center justify-between pt-4 pb-4 md:pt-6 md:pb-6">
              <Link href={`/contacts/${id}`}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  <X className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                </Button>
              </Link>
              <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">Edit Contact</h1>
              <div className="w-10" /> {/* Spacer for centering */}
            </div>

            <form onSubmit={handleSubmit} id="contact-form" className="space-y-6 pb-32 md:pb-40">
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
                  <span className="text-white/80 text-sm font-normal hidden sm:inline">
                    "Update Sarah's profession..."
                  </span>
                </div>
              </Button>

              {/* Form Fields */}
              <div className="space-y-6">
                {/* Name Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm md:text-base text-gray-700 dark:text-gray-300 font-medium">
                      First Name *
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
                    />
                  </div>

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
                      placeholder="Last name"
                      className="h-11 md:h-12 rounded-lg border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm md:text-base text-gray-700 dark:text-gray-300 font-medium">
                      Phone
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="+1 (555) 123-4567"
                      className="h-11 md:h-12 rounded-lg border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                </div>

                {/* Birthday */}
                <div className="space-y-2">
                  <Label htmlFor="birthday" className="text-sm md:text-base text-gray-700 dark:text-gray-300 font-medium">
                    Birthday
                  </Label>
                  <Input
                    id="birthday"
                    type="date"
                    value={formData.birthday}
                    onChange={(e) =>
                      setFormData({ ...formData, birthday: e.target.value })
                    }
                    className="h-11 md:h-12 rounded-lg border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white"
                  />
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
                  />
                </div>

                {/* Profession */}
                <div className="space-y-2">
                  <Label htmlFor="profession" className="text-sm md:text-base text-gray-700 dark:text-gray-300 font-medium">
                    Profession
                  </Label>
                  <Input
                    id="profession"
                    value={formData.profession}
                    onChange={(e) =>
                      setFormData({ ...formData, profession: e.target.value })
                    }
                    placeholder="e.g., Software Engineer, Designer"
                    className="h-11 md:h-12 rounded-lg border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white"
                  />
                </div>

                {/* Family Notes */}
                <div className="space-y-2">
                  <Label htmlFor="familyNotes" className="text-sm md:text-base text-gray-700 dark:text-gray-300 font-medium">
                    Family Notes
                  </Label>
                  <Textarea
                    id="familyNotes"
                    value={formData.familyNotes}
                    onChange={(e) =>
                      setFormData({ ...formData, familyNotes: e.target.value })
                    }
                    placeholder="Information about their family..."
                    className="min-h-[80px] rounded-lg border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white resize-none"
                  />
                </div>

                {/* Hobbies */}
                <div className="space-y-2">
                  <Label htmlFor="hobbies" className="text-sm md:text-base text-gray-700 dark:text-gray-300 font-medium">
                    Hobbies & Interests
                  </Label>
                  <Textarea
                    id="hobbies"
                    value={formData.hobbies}
                    onChange={(e) =>
                      setFormData({ ...formData, hobbies: e.target.value })
                    }
                    placeholder="What do they enjoy doing?"
                    className="min-h-[80px] rounded-lg border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white resize-none"
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
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Separate multiple tags with commas
                  </p>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Save Contact Button - Mobile */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 md:hidden">
          <Button
            type="submit"
            form="contact-form"
            disabled={saving || !formData.firstName.trim()}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              "Save Contact"
            )}
          </Button>
        </div>

        {/* Save Contact Button - Desktop */}
        <div className="hidden md:block fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6" style={{ marginLeft: '16rem' }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Button
              type="submit"
              form="contact-form"
              disabled={saving || !formData.firstName.trim()}
              className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Saving Changes...
                </>
              ) : (
                "Save Contact"
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
