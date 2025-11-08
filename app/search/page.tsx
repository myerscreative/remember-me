"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Filter, X, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  name: string;
  first_name: string;
  last_name: string | null;
  photo_url: string | null;
  match_type: string;
  match_field: string;
  relevance: number;
}

// Helper function to get initials from first and last name
const getInitials = (firstName: string, lastName: string | null): string => {
  if (!firstName) return "";
  const firstInitial = firstName.trim()[0]?.toUpperCase() || "";
  const lastInitial = lastName?.trim()[0]?.toUpperCase() || "";
  return (firstInitial + lastInitial) || firstName.substring(0, 2).toUpperCase();
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

// Helper function to get human-readable field name
const getFieldLabel = (field: string): string => {
  const labels: Record<string, string> = {
    where_met: "Where met",
    who_introduced: "Who introduced",
    why_stay_in_contact: "Why stay in contact",
    what_found_interesting: "What's interesting",
    most_important_to_them: "What's important to them",
    first_impression: "First impression",
    memorable_moment: "Memorable moment",
    interests: "Interests",
    notes: "Notes",
    name: "Name",
  };
  return labels[field] || field;
};

// Helper function to get match type badge color
const getMatchTypeBadge = (matchType: string): string => {
  const colors: Record<string, string> = {
    context: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    story: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
    impression: "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300",
    moment: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
    interests: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    notes: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    name: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  };
  return colors[matchType] || colors.name;
};

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Debounced search effect
  useEffect(() => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch("/api/search-context", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: searchTerm.trim() }),
        });

        if (response.ok) {
          const data = await response.json();
          setSearchResults(data.results || []);
        } else {
          console.error("Search failed:", await response.text());
          setSearchResults([]);
        }
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900 overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[950px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-purple-600" />
              Context Search
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Search by stories, context, and memories - not just names
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder='Try "met at conference" or "interested in sailing" or "works in biotech"'
              className="pl-10 pr-10 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-purple-400 dark:focus:border-purple-600 focus:bg-white dark:focus:bg-gray-700"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9"
                onClick={() => setSearchTerm("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            {isSearching && (
              <div className="absolute right-12 top-1/2 -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-purple-600 border-t-transparent"></div>
              </div>
            )}
          </div>

          {/* Example Searches */}
          {!searchTerm && (
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
              <p className="text-sm font-medium text-purple-900 dark:text-purple-300 mb-2">
                Try searching by:
              </p>
              <div className="flex flex-wrap gap-2">
                {["conference", "sailing", "startup founder", "introduced by John", "family with kids"].map((example) => (
                  <Badge
                    key={example}
                    variant="secondary"
                    className="cursor-pointer hover:bg-purple-200 dark:hover:bg-purple-800"
                    onClick={() => setSearchTerm(example)}
                  >
                    {example}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Search Results */}
          {searchTerm && searchTerm.length >= 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {searchResults.length > 0 ? `${searchResults.length} Results` : "No results"}
                </h2>
              </div>

              {searchResults.length > 0 ? (
                <div className="space-y-3">
                  {searchResults.map((contact) => (
                    <Link key={contact.id} href={`/contacts/${contact.id}`}>
                      <Card className="hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-700 transition-all cursor-pointer border border-gray-200 dark:border-gray-700">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <Avatar className="h-14 w-14 flex-shrink-0">
                              <AvatarImage src={contact.photo_url || undefined} />
                              <AvatarFallback className={cn("bg-gradient-to-br text-white text-lg font-semibold", getGradient(contact.name))}>
                                {getInitials(contact.first_name, contact.last_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-1">
                                {contact.first_name} {contact.last_name || ""}
                              </h3>
                              <div className="flex flex-wrap gap-2 items-center">
                                <Badge className={cn("text-xs font-medium", getMatchTypeBadge(contact.match_type))}>
                                  {getFieldLabel(contact.match_field)}
                                </Badge>
                                {contact.match_type === "story" && (
                                  <span className="text-xs text-purple-600 dark:text-purple-400 font-medium flex items-center gap-1">
                                    <Sparkles className="h-3 w-3" />
                                    Story match
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              ) : (
                <Card className="border-2 border-dashed border-gray-200 dark:border-gray-700">
                  <CardContent className="py-12 text-center">
                    <Search className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">No results found</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Try different keywords or search by context like "met at conference"
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

