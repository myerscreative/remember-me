import { useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatBirthday, getGradient, getInitialsFromFullName } from "@/lib/utils/contact-helpers";
import { cn } from "@/lib/utils";
import { ChevronRight, Star, Link as LinkIcon, CalendarDays, Cake, Loader2 } from "lucide-react";
import Link from "next/link";
import { Person } from "@/types/database.types";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import toast from "react-hot-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SearchResultCardProps {
  contact: Person;
  isCompactView?: boolean;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  tags?: string[];
  mutualCount?: number;
  onConnect?: (contact: Person) => void;
}

import { getRelationshipHealth } from "@/lib/conversation-helpers";
import { FREQUENCY_PRESETS } from "@/lib/relationship-health";
import { ArrowRight, RefreshCw } from "lucide-react";

export function SearchResultCard({ 
  contact, 
  isCompactView, 
  onToggleFavorite,
  tags = [],
  mutualCount = 0,
  onConnect
}: SearchResultCardProps) {
  const [isUpdatingFrequency, setIsUpdatingFrequency] = useState(false);
  const [currentFrequency, setCurrentFrequency] = useState(contact.target_frequency_days);
  
  const birthday = useMemo(() => {
    if (!contact.birthday) return null;
    try {
      return formatBirthday(contact.birthday);
    } catch (e) {
      return null; 
    }
  }, [contact.birthday]);

  const lastContact = useMemo(() => {
     if (!contact.last_interaction_date) return null;
     try {
       return format(parseISO(contact.last_interaction_date), "MMM d, yyyy");
     } catch (e) {
       return null;
     }
  }, [contact.last_interaction_date]);

  const health = getRelationshipHealth({
    ...contact,
    target_frequency_days: currentFrequency
  });

  // Stop propagation for connect button to prevent navigation
  const handleConnectClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onConnect?.(contact);
  };

  const handleUpdateFrequency = async (days: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (days === currentFrequency) return;

    setIsUpdatingFrequency(true);
    const oldFrequency = currentFrequency;
    setCurrentFrequency(days);

    try {
      const response = await fetch("/api/update-frequency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId: contact.id, frequencyDays: days }),
      });

      if (!response.ok) throw new Error("Failed to update frequency");
      
      toast.success("Follow-up frequency updated");
    } catch (error) {
      console.error("Error updating frequency:", error);
      toast.error("Failed to update frequency");
      setCurrentFrequency(oldFrequency);
    } finally {
      setIsUpdatingFrequency(false);
    }
  };

  return (
    <Link href={`/contacts/${contact.id}`}>
      <div 
        className={cn(
          "group relative bg-white dark:bg-[#1e1e2d] border border-gray-200 dark:border-gray-700/50 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-indigo-500/30 dark:hover:border-indigo-400/30 w-full p-5 backdrop-blur-sm",
          isCompactView && "flex items-center p-3 gap-3"
        )}
      >
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-indigo-50/0 dark:bg-indigo-900/0 group-hover:bg-indigo-50/10 dark:group-hover:bg-indigo-900/5 transition-colors pointer-events-none" />

        <div className="flex gap-4 items-start relative z-10">
            {/* Avatar Column */}
            <div className={cn("relative shrink-0", isCompactView ? "h-10 w-10" : "h-[56px] w-[56px]")}>
              <Avatar className="h-full w-full ring-2 ring-white dark:ring-gray-800 shadow-sm transition-transform group-hover:scale-105 duration-300">
                <AvatarImage src={contact.photo_url || undefined} alt={contact.name} className="object-cover" />
                <AvatarFallback className={cn("text-white font-semibold text-lg", getGradient(contact.name))}>
                  {getInitialsFromFullName(contact.name)}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={(e) => onToggleFavorite(contact.id, e)}
                className="absolute -bottom-1 -right-1 p-1 bg-white dark:bg-gray-800 rounded-full shadow-sm hover:scale-110 transition-transform z-20 border border-gray-100 dark:border-gray-700"
                title={contact.is_favorite ? "Remove from favorites" : "Add to favorites"}
              >
                <Star 
                  size={14} 
                  className={cn(
                    "transition-colors", 
                    contact.is_favorite ? "fill-amber-400 text-amber-400" : "text-gray-300 dark:text-gray-600 hover:text-amber-400"
                  )} 
                />
              </button>
            </div>

            {/* Info Column */}
            <div className="flex-1 min-w-0 flex flex-col">
                 <div className="flex justify-between items-center gap-3 mb-2">
                    <h3 className="font-semibold text-[18px] text-gray-900 dark:text-white truncate group-hover:text-indigo-400 transition-colors flex-1 min-w-0">
                      {contact.name}
                    </h3>

                    {/* Inline Connect Button */}
                    {!isCompactView && onConnect && (
                        <button
                            onClick={handleConnectClick}
                            className="shrink-0 bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/30 text-indigo-600 dark:text-indigo-200 px-3.5 py-1.5 rounded-lg text-[13px] font-semibold flex items-center gap-1.5 hover:bg-indigo-500/20 dark:hover:bg-indigo-500/30 hover:border-indigo-500/50 hover:text-indigo-700 dark:hover:text-indigo-100 transition-all z-20"
                        >
                            Connect <ArrowRight className="w-3 h-3 opacity-70" />
                        </button>
                    )}
                 </div>

                 {!isCompactView && (
                    <div className="space-y-1.5">
                        {/* Last Contacted Row */}
                        <div className={cn(
                            "flex items-center gap-2 text-sm font-medium",
                            health === 'overdue' ? "text-amber-600 dark:text-amber-500" : 
                            health === 'healthy' ? "text-emerald-600 dark:text-emerald-500" : "text-gray-500 dark:text-gray-400"
                        )}>
                             <CalendarDays size={14} className={cn("shrink-0", !lastContact && "opacity-70")} />
                             <span>{lastContact ? `Last contacted: ${lastContact}` : "No contact yet"}</span>
                             
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <span 
                                    className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/5 cursor-pointer hover:bg-black/10 dark:hover:bg-white/20 transition-colors z-20"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                      {isUpdatingFrequency ? (
                                        <Loader2 size={10} className="animate-spin" />
                                      ) : (
                                        <RefreshCw size={10} className="opacity-70" />
                                      )}
                                      {FREQUENCY_PRESETS.find(p => p.days === currentFrequency)?.label || "Custom"}
                                  </span>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-40 z-30">
                                  {FREQUENCY_PRESETS.map((preset) => (
                                    <DropdownMenuItem 
                                      key={preset.days}
                                      onClick={(e) => handleUpdateFrequency(preset.days, e)}
                                      className={cn(currentFrequency === preset.days && "bg-indigo-50 dark:bg-indigo-900/30 font-bold")}
                                    >
                                      {preset.label}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                             </DropdownMenu>
                        </div>

                        {/* Birthday Row */}
                        {birthday && (
                            <div className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400 font-medium">
                                <Cake size={14} className="shrink-0" />
                                <span>Birthday: {birthday}</span>
                            </div>
                        )}

                        {/* Tags */}
                        {tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3 mb-1">
                                {tags.slice(0, 3).map(tag => (
                                <Badge key={tag} variant="secondary" className="bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-200 border border-indigo-500/20 text-[11px] h-6 px-2 rounded-md font-medium hover:bg-indigo-500/20 dark:hover:bg-indigo-500/30 transition-colors">
                                    {tag}
                                </Badge>
                                ))}
                                {tags.length > 3 && (
                                <Badge variant="secondary" className="bg-gray-500/10 text-gray-600 dark:text-gray-400 border border-gray-500/20 text-[11px] h-6 px-2 rounded-md font-medium">
                                    +{tags.length - 3}
                                </Badge>
                                )}
                            </div>
                        )}
                    </div>
                 )}
            </div>
            
            {/* Compact View End */}
            {isCompactView && (
                <div className="ml-auto flex flex-col items-end gap-1">
                     <span className={cn(
                            "text-xs font-medium",
                            health === 'overdue' ? "text-amber-600 dark:text-amber-500" : 
                            health === 'healthy' ? "text-emerald-600 dark:text-emerald-500" : "text-gray-500 dark:text-gray-400"
                        )}>
                        {lastContact || "No contact"}
                     </span>
                     
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <span 
                            className="text-[10px] text-gray-400 hover:text-indigo-400 cursor-pointer transition-colors z-20"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {isUpdatingFrequency ? (
                                <Loader2 size={10} className="animate-spin inline mr-1" />
                              ) : null}
                            {FREQUENCY_PRESETS.find(p => p.days === currentFrequency)?.label}
                          </span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 z-30">
                          {FREQUENCY_PRESETS.map((preset) => (
                            <DropdownMenuItem 
                              key={preset.days}
                              onClick={(e) => handleUpdateFrequency(preset.days, e)}
                              className={cn(currentFrequency === preset.days && "bg-indigo-50 dark:bg-indigo-900/30 font-bold")}
                            >
                              {preset.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                     </DropdownMenu>
                </div>
            )}
        </div>
      </div>
    </Link>
  );
}
