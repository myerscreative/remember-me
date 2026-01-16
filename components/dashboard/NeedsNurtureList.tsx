"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ChevronRight, Cake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getGradient, getInitials, formatBirthday } from "@/lib/utils/contact-helpers";
import { getMethodIcon, getLastSeenText } from "@/lib/utils/interaction-utils";
import { UnifiedActionHub } from "@/components/dashboard/UnifiedActionHub";
import { getRelationshipStatus } from "@/app/network/utils/relationshipStatus";

interface NeedsNurtureListProps {
  contacts: any[]; // Using any to accommodate the supabase join structure broadly for now
}

export function NeedsNurtureList({ contacts = [] }: NeedsNurtureListProps) {
  const router = useRouter();
  const [activeTribe, setActiveTribe] = useState("All");
  const [selectedContact, setSelectedContact] = useState<any | null>(null);
  const [isSharedMemoryOpen, setIsSharedMemoryOpen] = useState(false);

  // Extract unique tribes from contacts
  const tribes = useMemo(() => {
    const uniqueTribes = new Set<string>(["All"]);
    
    contacts.forEach(contact => {
      // Handle the nested structure from supabase join: person_tags -> tags -> name
      const contactTags = contact.person_tags?.map((pt: any) => pt.tags?.name).filter(Boolean) || [];
      contactTags.forEach((tag: string) => uniqueTribes.add(tag));
    });

    return Array.from(uniqueTribes).sort();
  }, [contacts]);

  // Filter contacts based on activeTribe
  const filteredContacts = useMemo(() => {
    if (activeTribe === "All") return contacts;

    return contacts.filter(contact => {
      const contactTags = contact.person_tags?.map((pt: any) => pt.tags?.name).filter(Boolean) || [];
      return contactTags.includes(activeTribe);
    });
  }, [contacts, activeTribe]);

  return (
    <div className="space-y-4">
      {/* Header & View All */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-bold flex items-center gap-2 text-foreground uppercase tracking-tight">
          <AlertCircle className="h-4 w-4 text-orange-500" />
          Needs Nurture
        </h2>
        {filteredContacts.length > 15 && (
          <Button 
            variant="link" 
            size="sm" 
            className="text-[10px] h-6 text-orange-600" 
            onClick={() => router.push('/?filter=nurture')}
          >
            View All
          </Button>
        )}
      </div>

      {/* Tribe Filter Bar */}
      {tribes.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 px-1 scrollbar-hide -mx-1">
            {tribes.map(tribe => (
                <button
                    key={tribe}
                    onClick={() => setActiveTribe(tribe)}
                    className={cn(
                        "shrink-0 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide transition-all",
                        activeTribe === tribe
                            ? "bg-[#6366f1] text-white shadow-md shadow-indigo-500/20"
                            : "bg-transparent border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900"
                    )}
                >
                    {tribe}
                </button>
            ))}
        </div>
      )}

      {/* List */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden transition-all duration-300 ease-in-out">
        {filteredContacts.length > 0 ? (
          <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
            {filteredContacts.map((contact) => (
              <div 
                key={contact.id}
                className="group flex items-center justify-between px-3 py-2 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => {
                    setSelectedContact(contact);
                    setIsSharedMemoryOpen(true);
                }}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar className="h-8 w-8 border-2 border-background shadow-sm shrink-0">
                    <AvatarImage src={contact.photo_url} />
                    <AvatarFallback className={cn("text-[10px] text-white", getGradient(contact.name || ""))}>
                      {getInitials(contact.first_name, contact.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs text-foreground leading-tight truncate">{contact.name}</p>
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-1 opacity-75">
                        {getMethodIcon(contact.last_interaction_method)}
                        {contact.last_interaction_method || 'Contacted'}
                      </span>
                      <span>•</span>
                      <span>{getLastSeenText(contact.last_interaction_date)}</span>
                      {contact.birthday && (
                        <>
                          <span className="hidden sm:inline">•</span>
                          <span className="hidden sm:flex items-center gap-1 text-pink-500/80">
                            <Cake className="h-3 w-3" />
                            {formatBirthday(contact.birthday)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-xs font-sans",
                     getRelationshipStatus(contact).colorClass
                  )}>
                    {/* Logic Update: Check for 'next_goal_note' on latest interaction first. */}
                    {contact.latest_next_goal ? (
                        <span className="text-indigo-400 font-semibold italic flex items-center gap-1.5">
                           <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                           "{contact.latest_next_goal}"
                        </span>
                    ) : (
                        getRelationshipStatus(contact).label
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center flex flex-col items-center justify-center gap-4 min-h-[200px]">
             <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-2">
                <span className="text-2xl">🌱</span>
             </div>
             <div className="space-y-1">
                <p className="text-sm font-bold text-foreground">Your Garden is thriving!</p>
                <p className="text-xs text-muted-foreground">Everyone in <span className="font-bold text-emerald-600 dark:text-emerald-400">{activeTribe}</span> is up to date.</p>
             </div>
             <Button 
                variant="outline" 
                size="sm" 
                onClick={() => router.push('/')}
                className="mt-2 text-xs border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-900 dark:text-indigo-400 dark:hover:bg-indigo-900/50 bg-transparent"
             >
                View All Contacts
             </Button>
          </div>
        )}
      </div>

      {/* Shared Memories Modal */}
      {selectedContact && (
        <UnifiedActionHub 
            isOpen={isSharedMemoryOpen}
            onClose={() => setIsSharedMemoryOpen(false)}
            person={selectedContact}
            onAction={(type, note) => {
                // Determine template based on action type
                // In a perfect world we would open a 'LogInteractionModal', 
                // but for now let's just route them to the contact page with a query param 
                // or just close and let them know.
                // Reaping the benefit of the 'One-Tap' system - we can just navigate 
                // OR we can implement a quick log.
                // For this step, simply navigating to their page is a safe fallback
                // if we don't have the log modal here.
                setIsSharedMemoryOpen(false);
                router.push(`/contacts/${selectedContact.id}?action=${type}`);
            }}
        />
      )}
    </div>
  );
}
