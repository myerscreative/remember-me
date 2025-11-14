"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  Users,
  Sparkles,
  MessageCircle,
  Heart,
  Briefcase,
  Eye,
  MapPin,
  UserPlus,
} from "lucide-react";
import { use, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

// Helper function to get initials from first and last name
const getInitials = (firstName: string, lastName: string | null): string => {
  if (!firstName) return "";
  const firstInitial = firstName.trim()[0]?.toUpperCase() || "";
  const lastInitial = lastName?.trim()[0]?.toUpperCase() || "";
  return (firstInitial + lastInitial) || firstName.substring(0, 2).toUpperCase();
};

// Helper function to get full name
const getFullName = (firstName: string, lastName: string | null): string => {
  if (!firstName) return "";
  return lastName ? `${firstName} ${lastName}`.trim() : firstName.trim();
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

// Helper to format relative time
const getRelativeTime = (date: string | null): string => {
  if (!date) return "Never";
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
};

export default function BriefingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [contact, setContact] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch contact data
  useEffect(() => {
    async function fetchContact() {
      try {
        const supabase = createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          setError("Please log in to view briefings");
          setLoading(false);
          return;
        }

        const { data: person, error: personError } = await (supabase as any)
          .from("persons")
          .select("*")
          .eq("id", id)
          .eq("user_id", user.id)
          .single();

        if (personError || !person) {
          setError("Contact not found");
          setLoading(false);
          return;
        }

        setContact(person);
      } catch (error) {
        console.error("Error fetching contact:", error);
        setError("Failed to load contact");
      } finally {
        setLoading(false);
      }
    }

    fetchContact();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-[#1a1d24]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 dark:border-purple-400 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white dark:bg-[#1a1d24] p-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white/90 mb-2">Error</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">{error || "Contact not found"}</p>
          <Link href="/">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Contacts
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const fullName = getFullName(contact.first_name, contact.last_name);
  const initials = getInitials(contact.first_name, contact.last_name);
  const familyMembers = contact.family_members || [];

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-[#1a1d24] overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto w-full px-4 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Link href={`/contacts/${id}`}>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full bg-gray-100 dark:bg-[#252931] hover:bg-gray-200 dark:hover:bg-[#2d3139] shadow-sm dark:shadow-md dark:shadow-black/20"
              >
                <ArrowLeft className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </Button>
            </Link>
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <Briefcase className="h-5 w-5" />
              <span className="font-semibold text-sm">Meeting Brief</span>
            </div>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>

          {/* Contact Card */}
          <Card className="mb-4 bg-gray-50 dark:bg-[#252931] border border-gray-200 dark:border-[#3a3f4b] shadow-lg dark:shadow-md dark:shadow-black/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={contact.photo_url || undefined} />
                  <AvatarFallback className={cn("bg-gradient-to-br text-white text-2xl font-semibold", getGradient(fullName))}>
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white/90">{fullName}</h1>
                  {contact.last_contact && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                      <Clock className="h-4 w-4" />
                      Last contact: {getRelativeTime(contact.last_contact)}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Facts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Where You Met */}
            {contact.where_met && (
              <Card className="bg-gray-50 dark:bg-[#252931] border border-gray-200 dark:border-[#3a3f4b] dark:shadow-md dark:shadow-black/20 border-l-4 border-l-blue-500 dark:border-l-blue-400">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Where You Met
                    </h3>
                  </div>
                  <p className="text-sm text-gray-900 dark:text-gray-300">{contact.where_met}</p>
                </CardContent>
              </Card>
            )}

            {/* Who Introduced */}
            {contact.who_introduced && (
              <Card className="bg-gray-50 dark:bg-[#252931] border border-gray-200 dark:border-[#3a3f4b] dark:shadow-md dark:shadow-black/20 border-l-4 border-l-blue-500 dark:border-l-blue-400">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <UserPlus className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Who Introduced
                    </h3>
                  </div>
                  <p className="text-sm text-gray-900 dark:text-gray-300">{contact.who_introduced}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Conversation Starters */}
          {contact.interests && contact.interests.length > 0 && (
            <Card className="mb-4 bg-gray-50 dark:bg-[#252931] border border-gray-200 dark:border-[#3a3f4b] dark:shadow-md dark:shadow-black/20 border-l-4 border-l-blue-500 dark:border-l-blue-400">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MessageCircle className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Conversation Starters</h2>
                </div>
                <div className="space-y-2">
                  {contact.interests.slice(0, 3).map((interest: string, index: number) => (
                    <div key={index} className="flex items-start gap-2">
                      <Sparkles className="h-4 w-4 text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-700 dark:text-gray-300">Ask about their interest in {interest}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* What's Important to Them */}
          {contact.most_important_to_them && (
            <Card className="mb-4 bg-gray-50 dark:bg-[#252931] border border-gray-200 dark:border-[#3a3f4b] dark:shadow-md dark:shadow-black/20 border-l-4 border-l-blue-500 dark:border-l-blue-400">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">What's Important to Them</h2>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{contact.most_important_to_them}</p>
              </CardContent>
            </Card>
          )}

          {/* Family to Remember */}
          {familyMembers.length > 0 && (
            <Card className="mb-6 bg-gray-50 dark:bg-[#252931] border border-gray-200 dark:border-[#3a3f4b] dark:shadow-md dark:shadow-black/20 border-l-4 border-l-blue-500 dark:border-l-blue-400">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Family to Remember</h2>
                </div>
                <div className="space-y-2">
                  {familyMembers.map((member: any, index: number) => (
                    <div key={index} className="flex items-center gap-3 p-2 bg-white dark:bg-[#1a1d24] rounded-lg border border-gray-200 dark:border-[#3a3f4b]">
                      <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                        {member.relationship}
                      </Badge>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-300">{member.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Why This Relationship Matters */}
          {contact.why_stay_in_contact && (
            <Card className="mb-4 bg-gray-50 dark:bg-[#252931] border border-gray-200 dark:border-[#3a3f4b] dark:shadow-md dark:shadow-black/20 border-l-4 border-l-blue-500 dark:border-l-blue-400">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Why This Relationship Matters</h2>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{contact.why_stay_in_contact}</p>
              </CardContent>
            </Card>
          )}

          {/* What You Found Interesting */}
          {contact.what_found_interesting && (
            <Card className="mb-4 bg-gray-50 dark:bg-[#252931] border border-gray-200 dark:border-[#3a3f4b] dark:shadow-md dark:shadow-black/20 border-l-4 border-l-blue-500 dark:border-l-blue-400">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">What You Found Interesting</h2>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{contact.what_found_interesting}</p>
              </CardContent>
            </Card>
          )}

          {/* First Impression */}
          {contact.first_impression && (
            <Card className="mb-4 bg-gray-50 dark:bg-[#252931] border border-gray-200 dark:border-[#3a3f4b] dark:shadow-md dark:shadow-black/20 border-l-4 border-l-blue-500 dark:border-l-blue-400">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Your First Impression</h2>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic">{contact.first_impression}</p>
              </CardContent>
            </Card>
          )}

          {/* Action Button */}
          <div className="flex gap-3 mb-8">
            <Link href={`/contacts/${id}`} className="flex-1">
              <Button variant="outline" className="w-full border-gray-300 dark:border-[#3a3f4b] hover:bg-gray-50 dark:hover:bg-[#2d3139]">
                View Full Profile
              </Button>
            </Link>
            <Link href="/" className="flex-1">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Done
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
