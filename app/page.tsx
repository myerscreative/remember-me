"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Search, Settings, Plus, Users, Zap, List, Rows, Brain, X } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Person } from "@/types/database.types";
import { DecayAlertBanner } from "@/components/decay-alert-banner";
import { ExploreFilter } from "@/components/dashboard/ExploreFilter";

import { SearchResultCard } from "@/app/contacts/components/SearchResultCard";
import { ErrorFallback } from "@/components/error-fallback";

import { useRouter } from "next/navigation";
// Remove unused imports if necessary, or keep them. keeping imports safe.



export default function HomePage() {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [selectedInterest, setSelectedInterest] = useState<string | null>(null);
  const [showMutuals, setShowMutuals] = useState(false); // New state
  const [contacts, setContacts] = useState<Person[]>([]);
  const [contactTags, setContactTags] = useState<Map<string, string[]>>(new Map());
  const [mutualCounts, setMutualCounts] = useState<Map<string, number>>(new Map());
  const [allRelationships, setAllRelationships] = useState<any[]>([]);
  const [selectedConnectedPerson, setSelectedConnectedPerson] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCompactView, setIsCompactView] = useState(false);
  const [migrating, setMigrating] = useState(false);


  // ... (migrateFavorites stays same)
  // ... (loadContacts modified)

  // Fetch contacts from Supabase
  useEffect(() => {
    async function loadContacts() {
      // Reset error state
      setError(null);
      try {
        const supabase = createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          console.error("Authentication error:", userError);
          window.location.href = "/login";
          return;
        }

        let query = (supabase as any)
          .from("persons")
          .select("*")
          .eq("user_id", user.id);

        if (showArchived) {
          query = query.eq("archived", true);
        } else {
          query = query.or("archived.eq.false,archived.is.null");
        }

        const { data: persons, error } = await query.order("name");

        if (error) {
          console.error("Error fetching contacts:", error);
          setLoading(false);
          return;
        }

        setContacts(persons || []);

        // Fetch Tags
        if (persons && persons.length > 0) {
           const personIds = persons.map((p: any) => p.id);
           
           // Parallel fetch: Tags AND Connections
           const [tagsRes, connectionsRes] = await Promise.all([
             (supabase as any).from("person_tags").select("person_id, tags(name)").in("person_id", personIds),
             (supabase as any).from("inter_contact_relationships").select("contact_id_a, contact_id_b").eq("user_id", user.id)
           ]);

          // Process Tags
          const tagsMap = new Map<string, string[]>();
          tagsRes.data?.forEach((pt: any) => {
            const personId = pt.person_id;
            const tagName = pt.tags?.name;
            if (tagName) {
              if (!tagsMap.has(personId)) tagsMap.set(personId, []);
              tagsMap.get(personId)?.push(tagName);
            }
          });
          setContactTags(tagsMap);

          // Process Mutual Counts
          const countsMap = new Map<string, number>();
          // Logic: For each person, count how many times they appear in the relationships table
          // Note: relationships table is bidirectional in concept but stored as A-B.
          // If Person X is in A or B, that's a connection.
          const relationships = connectionsRes.data || [];
          setAllRelationships(relationships);

          relationships.forEach((rel: any) => {
             // Increment for A
             countsMap.set(rel.contact_id_a, (countsMap.get(rel.contact_id_a) || 0) + 1);
             // Increment for B
             countsMap.set(rel.contact_id_b, (countsMap.get(rel.contact_id_b) || 0) + 1);
          });
          setMutualCounts(countsMap);
        }
      } catch (error) {
        console.error("Error loading contacts:", error);
        setError(error instanceof Error ? error : new Error("Failed to load contacts"));
      } finally {
        setLoading(false);
      }
    }

    loadContacts();
  }, [showArchived]);

  // Toggle favorite status
  const handleToggleFavorite = async (contactId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Find the contact and toggle its favorite status
    const contact = contacts.find((c) => c.id === contactId);
    if (!contact) return;

    const newIsFavorite = !(contact as any).is_favorite;

    // Optimistically update the UI
    setContacts(
      contacts.map((c) =>
        c.id === contactId ? { ...c, is_favorite: newIsFavorite } as any : c
      )
    );

    try {
      // Call API to update in database
      const response = await fetch("/api/toggle-favorite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId, isFavorite: newIsFavorite }),
      });

      if (!response.ok) {
        throw new Error("Failed to update favorite status");
      }
    } catch (error) {
      // Revert on error
      console.error("Error toggling favorite:", error);
      setContacts(
        contacts.map((c) =>
          c.id === contactId ? { ...c, is_favorite: !newIsFavorite } as any : c
        )
      );
    }
  };

  // Toggle view mode
  const toggleViewMode = () => {
    const newMode = !isCompactView;
    setIsCompactView(newMode);
    localStorage.setItem("contactsViewMode", newMode ? "compact" : "normal");
  };

  // Filter contacts logic
  const filteredContacts = contacts
    .filter((contact) => {
      // Apply Mutual Filter
      if (showMutuals) {
         if ((mutualCounts.get(contact.id) || 0) === 0) return false;
      }

      // Apply category filter
      if (selectedFilter === "All") {
        // No filter
      } else if (selectedFilter === "Favorites") {
        if (!(contact as any).is_favorite) return false;
      } else {
        const tags = contactTags.get(contact.id) || [];
        const hasMatchingTag = tags.some(tag =>
          tag.toLowerCase() === selectedFilter.toLowerCase()
        );
        if (!hasMatchingTag) return false;
      }

      // Apply Interest filter
      if (selectedInterest) {
        if (!contact.interests || !contact.interests.includes(selectedInterest)) return false;
      }

      // Apply Connected To filter
      if (selectedConnectedPerson) {
        // Check if this contact is connected to selectedConnectedPerson
        // We look in allRelationships for a tuple containing both IDs
        const isConnected = allRelationships.some(rel => 
          (rel.contact_id_a === contact.id && rel.contact_id_b === selectedConnectedPerson) ||
          (rel.contact_id_b === contact.id && rel.contact_id_a === selectedConnectedPerson)
        );
        if (!isConnected) return false;
      }

      // Apply search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const nameMatch = contact.name.toLowerCase().includes(query);
        const emailMatch = contact.email?.toLowerCase().includes(query);
        const phoneMatch = contact.phone?.toLowerCase().includes(query);
        const notesMatch = contact.notes?.toLowerCase().includes(query);
        const whereMetMatch = contact.where_met?.toLowerCase().includes(query);
        return nameMatch || emailMatch || phoneMatch || notesMatch || whereMetMatch;
      }

      return true;
    });

  if (error) {
     // ... (Error UI)
      return (
      <div className="flex flex-col h-screen bg-white dark:bg-gray-900 overflow-hidden items-center justify-center">
        <ErrorFallback
          error={error}
          reset={() => window.location.reload()}
          title="Contacts unavailable"
          message="We ran into issues loading your contacts."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900 overflow-hidden">
      {/* Main Container */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[950px] mx-auto w-full px-4 sm:px-6 lg:px-8">
          {/* Header & Banner */}
          <div className="pt-6 pb-2 md:pt-8 md:pb-4 space-y-4">
             <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
               {showArchived ? "Archived Contacts" : "Contacts"}
             </h1>
             {!showArchived && <div className="-mt-1"><DecayAlertBanner /></div>}
             <div className="relative w-full max-w-2xl">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
               <Input
                 placeholder="Search your network..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full pl-9 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 border-transparent focus:bg-white dark:focus:bg-gray-900 focus:border-blue-500 transition-all font-medium"
               />
             </div>
          </div>

          {/* Sticky Toolbar */}
          <div className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 py-3 border-b border-gray-100 dark:border-gray-800 mb-6 transition-all hover:bg-white/95 dark:hover:bg-gray-900/95">
             <div className="max-w-[950px] mx-auto flex items-center justify-between gap-4">
               {/* LEFT: Filters */}
               <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide mask-fade-right">
                 <ExploreFilter
                   tags={Array.from(new Set(Array.from(contactTags.values()).flat())).sort()}
                   interests={Array.from(new Set(contacts.flatMap(c => c.interests || []))).sort()}
                   selectedTag={selectedFilter}
                   selectedInterest={selectedInterest}
                   showMutuals={showMutuals}
                   people={contacts.map(c => ({ id: c.id, name: c.name, photo_url: c.photo_url }))}
                   selectedConnectedPerson={selectedConnectedPerson}
                   onSelectTag={setSelectedFilter}
                   onSelectInterest={setSelectedInterest}
                   onSelectConnectedPerson={setSelectedConnectedPerson}
                   onToggleMutuals={setShowMutuals}
                 />
                 
                 <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

                 <button
                   onClick={() => { setSelectedFilter("All"); setSelectedInterest(null); setShowMutuals(false); setSelectedConnectedPerson(null); }}
                   className={cn(
                     "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 border border-transparent",
                     selectedFilter === "All" && !selectedInterest && !showMutuals && !selectedConnectedPerson
                       ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 shadow-sm"
                       : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                   )}
                 >
                   All
                 </button>
                 <button
                   onClick={() => setSelectedFilter("Favorites")}
                   className={cn(
                     "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 border border-transparent",
                     selectedFilter === "Favorites"
                       ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 shadow-sm"
                       : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                   )}
                 >
                   Favorites
                 </button>

                 {/* Active Filter Chips */}
                 {showMutuals && (
                    <div className="flex items-center animate-in fade-in slide-in-from-left-2 duration-200">
                      <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 shadow-sm flex items-center gap-1 border border-emerald-200 dark:border-emerald-800">
                        Mutuals
                        <button 
                          onClick={(e) => { e.stopPropagation(); setShowMutuals(false); }}
                          className="hover:text-emerald-900 dark:hover:text-emerald-100 ml-1 rounded-full hover:bg-emerald-200 dark:hover:bg-emerald-800 p-0.5"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    </div>
                 )}

                 {selectedFilter !== "All" && selectedFilter !== "Favorites" && (
                   <div className="flex items-center animate-in fade-in slide-in-from-left-2 duration-200">
                     <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 shadow-sm flex items-center gap-1 border border-blue-200 dark:border-blue-800">
                       {selectedFilter}
                       <button 
                         onClick={(e) => { e.stopPropagation(); setSelectedFilter("All"); }}
                         className="hover:text-blue-900 dark:hover:text-blue-100 ml-1 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 p-0.5"
                       >
                         <X size={12} />
                       </button>
                     </span>
                   </div>
                 )}

                 {selectedInterest && (
                   <div className="flex items-center animate-in fade-in slide-in-from-left-2 duration-200">
                     <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 shadow-sm flex items-center gap-1 border border-indigo-200 dark:border-indigo-800">
                       <span className="opacity-70 text-xs uppercase tracking-wider">Interest:</span> {selectedInterest}
                       <button 
                         onClick={(e) => { e.stopPropagation(); setSelectedInterest(null); }}
                         className="hover:text-indigo-900 dark:hover:text-indigo-100 ml-1 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-800 p-0.5"
                       >
                         <X size={12} />
                       </button>
                     </span>
                   </div>
                 )}

                  {selectedConnectedPerson && (
                    <div className="flex items-center animate-in fade-in slide-in-from-left-2 duration-200">
                      <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 shadow-sm flex items-center gap-1 border border-purple-200 dark:border-purple-800">
                         <span className="opacity-70 text-xs uppercase tracking-wider">Connected To:</span> {contacts.find(c => c.id === selectedConnectedPerson)?.name}
                         <button 
                           onClick={(e) => { e.stopPropagation(); setSelectedConnectedPerson(null); }}
                           className="hover:text-purple-900 dark:hover:text-purple-100 ml-1 rounded-full hover:bg-purple-200 dark:hover:bg-purple-800 p-0.5"
                         >
                           <X size={12} />
                         </button>
                       </span>
                    </div>
                  )}
               </div>

               {/* RIGHT: Actions */}
               <div className="flex items-center gap-2 shrink-0">
                  <Link href="/contacts/new" className="hidden lg:block">
                     <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white border-0 shadow-md hover:shadow-lg transition-all">
                       <Plus className="h-4 w-4 mr-2" />
                       Add Contact
                     </Button>
                  </Link>
                  <Link href="/quick-capture" className="hidden lg:block">
                     <Button variant="ghost" size="icon" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400" title="Quick Capture">
                       <Zap className="h-4 w-4" />
                     </Button>
                  </Link>
                  <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1 hidden lg:block" />
                  <Button 
                     variant="ghost" 
                     size="icon" 
                     onClick={() => router.push('/practice')}
                     className="h-9 w-9 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                     title="Daily Practice"
                  >
                     <Brain size={18} />
                  </Button>
                  <Button
                    variant="ghost" 
                    size="icon" 
                    onClick={toggleViewMode}
                    className={cn("h-9 w-9 transition-colors", isCompactView ? "text-blue-600 bg-blue-50 dark:bg-blue-900/20" : "text-gray-500 hover:text-gray-700 dark:text-gray-400")}
                    title="Toggle View"
                  >
                    {isCompactView ? <List size={18} /> : <Rows size={18} />}
                  </Button>
                  <Link href="/settings">
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-500 hover:text-gray-700 dark:text-gray-400">
                      <Settings size={18} />
                    </Button>
                  </Link>
               </div>
             </div>
          </div>

          {/* Contact List */}
          <div className="pb-6 md:pb-8 lg:pb-12">
             {loading ? (
               <div className="flex items-center justify-center py-16">
                 <p className="text-gray-500 dark:text-gray-400">Loading contacts...</p>
               </div>
             ) : (
             <div className={cn("space-y-2", !isCompactView && "md:space-y-4 lg:space-y-5")}>
               {filteredContacts.length > 0 ? (
                 filteredContacts.map((contact) => (
                   <SearchResultCard
                     key={contact.id}
                     contact={contact}
                     isCompactView={isCompactView}
                     onToggleFavorite={handleToggleFavorite}
                     tags={contactTags.get(contact.id) || []}
                     mutualCount={mutualCounts.get(contact.id) || 0}
                   />
                 ))
               ) : (
                  <div className="flex flex-col items-center justify-center py-16 md:py-20 px-4">
                     <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-4 mb-4">
                       <Users className="h-8 w-8 md:h-10 md:w-10 text-gray-400 dark:text-gray-500" />
                     </div>
                     <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-2">No contacts found</h3>
                     <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 text-center max-w-md mb-2">
                        {searchQuery.trim() ? `No contacts match "${searchQuery}"` : "Try adjusting filters or adding new contacts."}
                     </p>
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
