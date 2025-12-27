"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getGradient, getInitials } from "@/lib/utils/contact-helpers";
import { getMethodIcon, getLastSeenText } from "@/lib/utils/interaction-utils";
import { UnifiedActionHub } from "@/components/dashboard/UnifiedActionHub";

interface NeedsNurtureListProps {
  contacts: any[]; // Using any to accommodate the supabase join structure broadly for now
}

export function NeedsNurtureList({ contacts = [] }: NeedsNurtureListProps) {
  const router = useRouter();
  const [activeTribe, setActiveTribe] = useState("All");
  const [selectedContact, setSelectedContact] = useState<any | null>(null);
  const [isLoreOpen, setIsLoreOpen] = useState(false);

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
        <h2 className="text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100 uppercase tracking-tight">
          <AlertCircle className="h-4 w-4 text-orange-500" />
          Needs Nurture
        </h2>
        {filteredContacts.length > 15 && (
          <Button 
            variant="link" 
            size="sm" 
            className="text-[10px] h-6 text-orange-600" 
            onClick={() => router.push('/contacts?filter=nurture')}
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
                        "flex-shrink-0 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide transition-all",
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
      <div className="bg-white dark:bg-card border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden transition-all duration-300 ease-in-out">
        {filteredContacts.length > 0 ? (
          <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
            {filteredContacts.map((contact) => (
              <div 
                key={contact.id}
                className="group flex items-center justify-between px-3 py-2 hover:bg-orange-50/50 dark:hover:bg-orange-900/10 transition-colors cursor-pointer"
                onClick={() => {
                    setSelectedContact(contact);
                    setIsLoreOpen(true);
                }}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8 border-2 border-white dark:border-slate-800 shadow-sm">
                    <AvatarImage src={contact.photo_url} />
                    <AvatarFallback className={cn("text-[10px] text-white", getGradient(contact.name || ""))}>
                      {getInitials(contact.first_name, contact.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-bold text-xs text-slate-900 dark:text-slate-100 leading-tight">{contact.name}</p>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                      <span className="flex items-center gap-1 opacity-75">
                        {getMethodIcon(contact.last_interaction_method)}
                        {contact.last_interaction_method || 'Contacted'}
                      </span>
                      <span>•</span>
                      <span>{getLastSeenText(contact.last_interaction_date)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className={cn(
                    "text-[9px] font-bold px-1.5 h-4 min-w-[32px] justify-center",
                    contact.days_since_contact > 90 ? "bg-red-50 text-red-700 border border-red-100" : "bg-orange-50 text-orange-700 border border-orange-100"
                  )}>
                    {contact.days_since_contact}d
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
            <span className="text-2xl">🌱</span>
            <p>No contacts in <span className="font-bold text-slate-500">{activeTribe}</span> need attention.</p>
          </div>
        )}
      </div>

      {/* Deep Lore Modal */}
      {selectedContact && (
        <UnifiedActionHub 
            isOpen={isLoreOpen}
            onClose={() => setIsLoreOpen(false)}
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
                setIsLoreOpen(false);
                router.push(`/contacts/${selectedContact.id}?action=${type}`);
            }}
        />
      )}
    </div>
  );
}
