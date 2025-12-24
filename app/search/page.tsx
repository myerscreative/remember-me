"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  X,
  Sparkles,
  Filter,
  Clock,
  Star,
  Download,
  Zap,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  searchPersonsFullText,
  getRecentContacts,
  getContactsByImportance,
  getImportedWithoutContext,
  debounce,
  type SearchResult,
} from "@/lib/search/searchUtils";
import type { Person } from "@/types/database.types";
import { getInitials, getGradient } from "@/lib/utils/contact-helpers";

type QuickFilter = "recent" | "high-priority" | "imported" | null;

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTime, setSearchTime] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState<QuickFilter>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filters state
  const [hasContext, setHasContext] = useState<boolean | null>(null);
  const [imported, setImported] = useState<boolean | null>(null);

  // Debounced search function
  const performSearch = useCallback(
    debounce(async (query: string) => {
      if (!query || query.trim().length < 2) {
        setSearchResults([]);
        setSearchTime(null);
        return;
      }

      setIsSearching(true);
      const startTime = performance.now();

      try {
        const results = await searchPersonsFullText(query, {
          limit: 50,
          hasContext: hasContext,
          imported: imported,
        });

        const endTime = performance.now();
        setSearchTime(endTime - startTime);
        setSearchResults(results);
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    [hasContext, imported]
  );

  // Search effect
  useEffect(() => {
    if (activeFilter) {
      // If a quick filter is active, don't search
      return;
    }

    performSearch(searchTerm);
  }, [searchTerm, performSearch, activeFilter]);

  // Load quick filter results
  useEffect(() => {
    if (!activeFilter) {
      if (!searchTerm) {
        setSearchResults([]);
      }
      return;
    }

    const loadFilteredResults = async () => {
      setIsSearching(true);
      const startTime = performance.now();

      try {
        let results: Person[] = [];

        switch (activeFilter) {
          case "recent":
            results = await getRecentContacts(20);
            break;
          case "high-priority":
            results = await getContactsByImportance("high", 20);
            break;
          case "imported":
            results = await getImportedWithoutContext(20);
            break;
        }

        const endTime = performance.now();
        setSearchTime(endTime - startTime);
        setSearchResults(results as SearchResult[]);
      } catch (error) {
        console.error("Filter error:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    loadFilteredResults();
  }, [activeFilter]);

  const handleQuickFilter = (filter: QuickFilter) => {
    if (activeFilter === filter) {
      setActiveFilter(null);
      setSearchTerm("");
    } else {
      setActiveFilter(filter);
      setSearchTerm("");
    }
  };

  const clearAll = () => {
    setSearchTerm("");
    setActiveFilter(null);
    setHasContext(null);
    setImported(null);
    setSearchResults([]);
    setSearchTime(null);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden pb-16 md:pb-0">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto w-full px-4 py-6 space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Zap className="h-8 w-8 text-purple-600" />
              Fast Search
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Lightning-fast full-text search across all your contacts
            </p>
            {searchTime !== null && (
              <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                <Sparkles className="h-4 w-4" />
                Found in {searchTime.toFixed(0)}ms
              </p>
            )}
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder='Search by name, email, context, or keywords...'
              className="pl-10 pr-10 h-12 rounded-xl bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setActiveFilter(null);
              }}
              disabled={activeFilter !== null}
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9"
                onClick={clearAll}
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

          {/* Quick Filters */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Quick Filters
              </h3>
              {activeFilter && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                  className="text-xs"
                >
                  Clear
                </Button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant={activeFilter === "recent" ? "default" : "outline"}
                size="sm"
                onClick={() => handleQuickFilter("recent")}
                className={cn(
                  "flex items-center gap-2",
                  activeFilter === "recent" && "bg-purple-600 hover:bg-purple-700"
                )}
              >
                <Clock className="h-4 w-4" />
                Recent
              </Button>

              <Button
                variant={activeFilter === "high-priority" ? "default" : "outline"}
                size="sm"
                onClick={() => handleQuickFilter("high-priority")}
                className={cn(
                  "flex items-center gap-2",
                  activeFilter === "high-priority" && "bg-purple-600 hover:bg-purple-700"
                )}
              >
                <Star className="h-4 w-4" />
                High Priority
              </Button>

              <Button
                variant={activeFilter === "imported" ? "default" : "outline"}
                size="sm"
                onClick={() => handleQuickFilter("imported")}
                className={cn(
                  "flex items-center gap-2",
                  activeFilter === "imported" && "bg-purple-600 hover:bg-purple-700"
                )}
              >
                <Download className="h-4 w-4" />
                Imported (No Context)
              </Button>
            </div>
          </div>

          {/* Example Searches */}
          {!searchTerm && !activeFilter && (
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
              <p className="text-sm font-medium text-purple-900 dark:text-purple-300 mb-2">
                Try searching:
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  "conference",
                  "investor",
                  "startup",
                  "designer",
                  "met through John",
                  "AI",
                ].map((example) => (
                  <Badge
                    key={example}
                    variant="secondary"
                    className="cursor-pointer hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
                    onClick={() => {
                      setSearchTerm(example);
                      setActiveFilter(null);
                    }}
                  >
                    {example}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Filter Description */}
          {activeFilter && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                {activeFilter === "recent" && "Showing contacts you've interacted with recently"}
                {activeFilter === "high-priority" && "Showing your high-priority contacts"}
                {activeFilter === "imported" && "Showing imported contacts that need context added"}
              </p>
            </div>
          )}

          {/* Search Results */}
          {(searchTerm || activeFilter) && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {searchResults.length > 0
                    ? `${searchResults.length} Result${searchResults.length !== 1 ? "s" : ""}`
                    : "No results"}
                </h2>
              </div>

              {searchResults.length > 0 ? (
                <div className="space-y-3">
                  {searchResults.map((contact) => (
                    <Link key={contact.id} href={`/contacts/${contact.id}`}>
                      <Card className="hover:shadow-md hover:border-purple-300 dark:hover:border-purple-700 transition-all cursor-pointer border border-gray-200 dark:border-gray-700">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <Avatar className="h-12 w-12 flex-shrink-0">
                              <AvatarImage src={contact.photo_url || undefined} />
                              <AvatarFallback
                                className={cn(
                                  "bg-gradient-to-br text-white font-semibold",
                                  getGradient(contact.name)
                                )}
                              >
                                {getInitials(contact.first_name, contact.last_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                {contact.first_name} {contact.last_name || ""}
                              </h3>

                              <div className="flex flex-wrap gap-2 items-center">
                                {contact.email && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {contact.email}
                                  </span>
                                )}
                                {contact.imported && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                                  >
                                    Imported
                                  </Badge>
                                )}
                                {contact.importance && (
                                  <Badge
                                    variant="secondary"
                                    className={cn(
                                      "text-xs",
                                      contact.importance === "high" &&
                                        "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                                    )}
                                  >
                                    {contact.importance}
                                  </Badge>
                                )}
                              </div>

                              {(contact.relationship_summary || contact.where_met) && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                                  {contact.relationship_summary || contact.where_met}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              ) : !isSearching ? (
                <Card className="border-2 border-dashed border-gray-200 dark:border-gray-700">
                  <CardContent className="py-12 text-center">
                    <Search className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      No results found
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Try different keywords or use quick filters above
                    </p>
                  </CardContent>
                </Card>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
