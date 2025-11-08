"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Search, Settings, ChevronRight, Plus, Users, Star, Archive, Zap } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Person } from "@/types/database.types";
import { DecayAlertBanner } from "@/components/decay-alert-banner";

const filterOptions = ["All", "Favorites", "Investor", "Startup", "Friend"];

// Helper function to format birthday as "Month Day" (e.g., "Dec 1", "Nov 3")
const formatBirthday = (birthday: string | null): string => {
  if (!birthday) return "";
  try {
    // Parse the date string (format: YYYY-MM-DD)
    const date = new Date(birthday + 'T00:00:00'); // Add time to avoid timezone issues
    // Check if date is valid
    if (isNaN(date.getTime())) return "";
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return "";
  }
};

// Helper function to get initials from name
const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
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

export default function HomePage() {
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [contacts, setContacts] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);

  // Load favorites from localStorage on mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem("networkFavorites");
    if (savedFavorites) {
      try {
        const favoriteIds = JSON.parse(savedFavorites);
        setFavorites(new Set(favoriteIds));
      } catch (e) {
        console.error("Error parsing favorites:", e);
      }
    }
  }, []);

  // Fetch contacts from Supabase
  useEffect(() => {
    async function loadContacts() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setLoading(false);
          return;
        }

        let query = supabase
          .from("persons")
          .select("*")
          .eq("user_id", user.id);

        // Filter by archived status
        if (showArchived) {
          query = query.eq("archived", true);
        } else {
          query = query.eq("archived", false);
        }

        const { data: persons, error } = await query.order("name");

        if (error) {
          console.error("Error fetching contacts:", error);
          setLoading(false);
          return;
        }

        // Debug: Log contacts to verify birthday field
        console.log("Fetched contacts:", persons?.map(p => ({ name: p.name, birthday: p.birthday, archived: p.archived })));

        setContacts(persons || []);
      } catch (error) {
        console.error("Error loading contacts:", error);
      } finally {
        setLoading(false);
      }
    }

    loadContacts();
  }, [showArchived]);

  // Toggle favorite status
  const handleToggleFavorite = (contactId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const newFavorites = new Set(favorites);
    if (newFavorites.has(contactId)) {
      newFavorites.delete(contactId);
    } else {
      newFavorites.add(contactId);
    }
    setFavorites(newFavorites);
    localStorage.setItem("networkFavorites", JSON.stringify(Array.from(newFavorites)));
  };

  // Filter contacts based on selected filter
  const filteredContacts = selectedFilter === "All" 
    ? contacts 
    : selectedFilter === "Favorites"
    ? contacts.filter((contact) => favorites.has(contact.id))
    : contacts; // For now, category filters not implemented (would need tags/categories)

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900 overflow-hidden">
      {/* Main Container - Centered on Desktop */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[950px] mx-auto w-full px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between pt-6 pb-4 md:pt-8 md:pb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              {showArchived ? "Archived Contacts" : "Contacts"}
            </h1>
            <div className="flex items-center gap-2">
              {/* Desktop: Add Contact Button */}
              <Link href="/contacts/new" className="hidden lg:block">
                <Button className="bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Contact
                </Button>
              </Link>
              
              {/* Desktop: Quick Capture Button */}
              <Link href="/quick-capture" className="hidden lg:block">
                <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 dark:from-cyan-400 dark:to-blue-500 hover:from-cyan-600 hover:to-blue-700 dark:hover:from-cyan-500 dark:hover:to-blue-600 text-white">
                  <Zap className="h-4 w-4 mr-2" />
                  Quick Capture
                </Button>
              </Link>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowArchived(!showArchived)}
                className={cn(
                  "h-10 w-10 md:h-11 md:w-11 rounded-full transition-colors",
                  showArchived
                    ? "bg-orange-100 hover:bg-orange-200 dark:bg-orange-900 dark:hover:bg-orange-800"
                    : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                )}
                title={showArchived ? "Show active contacts" : "Show archived contacts"}
              >
                <Archive className={cn(
                  "h-5 w-5",
                  showArchived ? "text-orange-700 dark:text-orange-300" : "text-gray-700 dark:text-gray-300"
                )} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 md:h-11 md:w-11 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <Search className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </Button>
              <Link href="/settings">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 md:h-11 md:w-11 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  <Settings className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Search Bar */}
          <div className="pb-6 md:pb-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400 dark:text-gray-500" />
              <Input
                placeholder="Who are you trying to remember?"
                className="w-full pl-9 md:pl-10 h-11 md:h-12 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm md:text-base focus:border-gray-300 dark:focus:border-gray-600 focus:bg-white dark:focus:bg-gray-700 transition-colors"
              />
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="pb-6 md:pb-8">
            <div className="flex justify-center gap-2 md:gap-3 overflow-x-auto scrollbar-hide md:overflow-x-visible">
              {filterOptions.map((filter) => {
                const isSelected = selectedFilter === filter;
                const isPrimary = isSelected && filter !== "All" && filter !== "Favorites";
                const isAllSelected = filter === "All" && selectedFilter === "All";
                const isFavoritesSelected = filter === "Favorites" && selectedFilter === "Favorites";
                
                return (
                  <button
                    key={filter}
                    onClick={() => setSelectedFilter(filter)}
                    className={cn(
                      "px-4 py-2 md:px-5 md:py-2.5 rounded-full text-sm md:text-base font-medium whitespace-nowrap transition-all duration-200",
                      isPrimary
                        ? "bg-blue-600 dark:bg-blue-500 text-white shadow-sm"
                        : isAllSelected
                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                        : isFavoritesSelected
                        ? "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/50"
                        : isSelected
                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                        : filter === "Favorites"
                        ? "bg-white dark:bg-gray-800 text-amber-600 dark:text-amber-400 border border-amber-600 dark:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:border-amber-700 dark:hover:border-amber-400"
                        : "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-700 dark:hover:border-blue-400"
                    )}
                  >
                    {filter}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Decay Alert Banner - Only show for active contacts */}
          {!showArchived && <DecayAlertBanner />}

          {/* Contact List */}
          <div className="pb-6 md:pb-8 lg:pb-12">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <p className="text-gray-500 dark:text-gray-400">Loading contacts...</p>
              </div>
            ) : (
            <div className="space-y-4 md:space-y-5">
              {filteredContacts.length > 0 ? (
                filteredContacts.map((contact) => (
                <Link
                  key={contact.id}
                  href={`/contacts/${contact.id}`}
                  className="group flex items-start gap-3 md:gap-4 p-4 md:p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200"
                >
                  {/* Avatar with gradient */}
                  <Avatar className="h-12 w-12 md:h-14 md:w-14 shrink-0">
                    <AvatarImage src={contact.photo_url || ""} />
                    <AvatarFallback
                      className={cn(
                        "bg-gradient-to-br text-white font-semibold text-sm md:text-base",
                        getGradient(contact.name)
                      )}
                    >
                      {getInitials(contact.name)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Contact Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-900 dark:text-white text-base md:text-lg leading-tight">
                        {contact.name}
                      </h3>
                      <button
                        onClick={(e) => handleToggleFavorite(contact.id, e)}
                        className={cn(
                          "shrink-0 transition-all duration-200 hover:scale-110",
                          favorites.has(contact.id) ? "text-amber-500 dark:text-amber-400" : "text-gray-300 dark:text-gray-600 hover:text-amber-400"
                        )}
                        title={favorites.has(contact.id) ? "Remove from favorites" : "Add to favorites"}
                      >
                        <Star 
                          className={cn(
                            "h-4 w-4 md:h-5 md:w-5",
                            favorites.has(contact.id) && "fill-current"
                          )} 
                        />
                      </button>
                    </div>
                    {/* Birthday display - always show when available */}
                    {contact.birthday && (
                      <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mb-1 leading-tight">
                        {formatBirthday(contact.birthday)}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1.5 md:gap-2">
                      {/* Tags would come from person_tags relationship - placeholder for now */}
                    </div>
                  </div>

                  {/* Chevron */}
                  <ChevronRight className="h-5 w-5 md:h-6 md:w-6 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400 shrink-0 mt-1 transition-all duration-200 group-hover:translate-x-1" />
                </Link>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-16 md:py-20 px-4">
                  <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-4 mb-4">
                    <Users className="h-8 w-8 md:h-10 md:w-10 text-gray-400 dark:text-gray-500" />
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    No contacts found
                  </h3>
                  <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 text-center max-w-md mb-2">
                    {selectedFilter === "All" 
                      ? (
                        <>
                          <span className="lg:hidden">Get started by adding your first contact using the blue button in the bottom right!</span>
                          <span className="hidden lg:inline">Get started by clicking "Add Contact" in the top right corner!</span>
                        </>
                      )
                      : `No contacts match the "${selectedFilter}" filter.`}
                  </p>
                  {selectedFilter === "All" && (
                    <div className="flex items-center gap-2 text-xs md:text-sm text-gray-400 dark:text-gray-500 mt-4">
                      <Zap className="h-4 w-4" />
                      <span className="lg:hidden">Use Quick Capture for networking events</span>
                      <span className="hidden lg:inline">Tip: Use "Quick Capture" for fast entry at networking events</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Action Buttons - Mobile & Tablet Only */}
      <div className="lg:hidden fixed bottom-20 md:bottom-8 right-4 md:right-8 z-40 flex flex-col gap-3">
        {/* Quick Capture FAB */}
        <Link href="/quick-capture">
          <div className="group relative">
            <Button
              size="icon"
              className="h-14 w-14 md:h-16 md:w-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 dark:from-cyan-400 dark:to-blue-500 hover:from-cyan-600 hover:to-blue-700 dark:hover:from-cyan-500 dark:hover:to-blue-600 shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.2)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.4)] transition-all duration-200 hover:scale-105"
            >
              <Zap className="h-6 w-6 md:h-7 md:w-7 text-white" />
            </Button>
            {/* Tooltip */}
            <span className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none bg-gray-900 dark:bg-gray-700 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg">
              Quick Capture
              <span className="absolute top-full right-4 -translate-y-px w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></span>
            </span>
          </div>
        </Link>

        {/* Add Contact FAB */}
        <Link href="/contacts/new">
          <div className="group relative">
            <Button
              size="icon"
              className="h-14 w-14 md:h-16 md:w-16 rounded-full bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.2)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.4)] transition-all duration-200 hover:scale-105"
            >
              <Plus className="h-6 w-6 md:h-7 md:w-7 text-white" />
            </Button>
            {/* Tooltip */}
            <span className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none bg-gray-900 dark:bg-gray-700 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg">
              Add Contact
              <span className="absolute top-full right-4 -translate-y-px w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></span>
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}
