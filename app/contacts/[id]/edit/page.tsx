"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Mic } from "lucide-react";
import Link from "next/link";

// Mock function to get contact data - replace with actual data fetching
const getContact = (id: string) => {
  return {
    id,
    name: "Sarah Kim",
    whereMet: "AI Summit in San Diego",
    introducedBy: "John Park",
    whyStayInContact: "Building a startup that could align with FlowDoors.",
    whatInteresting: "Deep expertise in user empathy and design thinking.",
    whatsImportant: "Passionate about sustainable design and user-centered product development.",
    tags: "UX Designer, Tesla, Startup",
  };
};

export default function EditContactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const initialContact = getContact(id);
  
  const [formData, setFormData] = useState({
    name: initialContact.name,
    whereMet: initialContact.whereMet,
    introducedBy: initialContact.introducedBy,
    whyStayInContact: initialContact.whyStayInContact,
    whatInteresting: initialContact.whatInteresting,
    whatsImportant: initialContact.whatsImportant,
    tags: initialContact.tags,
  });

  useEffect(() => {
    // Reset form when contact data changes
    setFormData({
      name: initialContact.name,
      whereMet: initialContact.whereMet,
      introducedBy: initialContact.introducedBy,
      whyStayInContact: initialContact.whyStayInContact,
      whatInteresting: initialContact.whatInteresting,
      whatsImportant: initialContact.whatsImportant,
      tags: initialContact.tags,
    });
  }, [initialContact]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement save to Supabase
    console.log("Updating contact:", formData);
    router.push(`/contacts/${id}`);
  };

  const handleVoiceEntry = () => {
    // TODO: Implement voice input functionality
    console.log("Voice entry clicked");
  };

  return (
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
              className="w-full h-14 md:h-16 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold text-base md:text-lg shadow-lg"
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
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm md:text-base text-gray-700 font-medium">
                  Name
                </Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Full name"
                  className="h-11 md:h-12 rounded-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                />
              </div>

              {/* Where did we meet? */}
              <div className="space-y-2">
                <Label htmlFor="whereMet" className="text-sm md:text-base text-gray-700 font-medium">
                  Where did we meet?
                </Label>
                <Input
                  id="whereMet"
                  value={formData.whereMet}
                  onChange={(e) =>
                    setFormData({ ...formData, whereMet: e.target.value })
                  }
                  placeholder="e.g., AI Summit, coffee shop, Zoom call"
                  className="h-11 md:h-12 rounded-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                />
              </div>

              {/* Who introduced us? */}
              <div className="space-y-2">
                <Label htmlFor="introducedBy" className="text-sm md:text-base text-gray-700 font-medium">
                  Who introduced us?
                </Label>
                <Input
                  id="introducedBy"
                  value={formData.introducedBy}
                  onChange={(e) =>
                    setFormData({ ...formData, introducedBy: e.target.value })
                  }
                  placeholder="Leave blank if met directly"
                  className="h-11 md:h-12 rounded-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                />
              </div>

              {/* Why stay in contact? */}
              <div className="space-y-2">
                <Label htmlFor="whyStayInContact" className="text-sm md:text-base text-gray-700 font-medium">
                  Why stay in contact?
                </Label>
                <Textarea
                  id="whyStayInContact"
                  value={formData.whyStayInContact}
                  onChange={(e) =>
                    setFormData({ ...formData, whyStayInContact: e.target.value })
                  }
                  placeholder="What's the value of this relationship?"
                  className="min-h-[100px] rounded-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 resize-none"
                />
              </div>

              {/* What did I find interesting? */}
              <div className="space-y-2">
                <Label htmlFor="whatInteresting" className="text-sm md:text-base text-gray-700 font-medium">
                  What did I find interesting?
                </Label>
                <Textarea
                  id="whatInteresting"
                  value={formData.whatInteresting}
                  onChange={(e) =>
                    setFormData({ ...formData, whatInteresting: e.target.value })
                  }
                  placeholder="What stood out about them?"
                  className="min-h-[100px] rounded-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 resize-none"
                />
              </div>

              {/* What's important to them? */}
              <div className="space-y-2">
                <Label htmlFor="whatsImportant" className="text-sm md:text-base text-gray-700 font-medium">
                  What's important to them?
                </Label>
                <Textarea
                  id="whatsImportant"
                  value={formData.whatsImportant}
                  onChange={(e) =>
                    setFormData({ ...formData, whatsImportant: e.target.value })
                  }
                  placeholder="Their priorities, values, goals..."
                  className="min-h-[100px] rounded-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 resize-none"
                />
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label htmlFor="tags" className="text-sm md:text-base text-gray-700 font-medium">
                  Tags
                </Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData({ ...formData, tags: e.target.value })
                  }
                  placeholder="e.g., Investor, Friend, AI Summit"
                  className="h-11 md:h-12 rounded-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                />
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
          className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base rounded-lg shadow-lg"
        >
          Save Contact
        </Button>
      </div>

      {/* Save Contact Button - Desktop */}
      <div className="hidden md:block fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 p-6" style={{ marginLeft: '16rem' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button
            type="submit"
            form="contact-form"
            className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg rounded-lg shadow-lg"
          >
            Save Contact
          </Button>
        </div>
      </div>
    </div>
  );
}

