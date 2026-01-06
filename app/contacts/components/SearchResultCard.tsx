import { useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatBirthday, getGradient, getInitialsFromFullName } from "@/lib/utils/contact-helpers";
import { cn } from "@/lib/utils";
import { ChevronRight, Star, Link as LinkIcon, CalendarDays, Cake } from "lucide-react";
import Link from "next/link";
import { Person } from "@/types/database.types";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";

interface SearchResultCardProps {
  contact: Person;
  isCompactView?: boolean;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  tags?: string[];
  mutualCount?: number;
}

export function SearchResultCard({ 
  contact, 
  isCompactView, 
  onToggleFavorite,
  tags = [],
  mutualCount = 0
}: SearchResultCardProps) {
  
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

  return (
    <Link href={`/contacts/${contact.id}`}>
      <div 
        className={cn(
          "group relative bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-blue-500/30 dark:hover:border-blue-400/30 w-full",
          isCompactView && "flex items-center p-3 gap-3"
        )}
      >
        {/* Selection/Hover Overlay */}
        <div className="absolute inset-0 bg-blue-50/0 dark:bg-blue-900/0 group-hover:bg-blue-50/30 dark:group-hover:bg-blue-900/10 transition-colors pointer-events-none" />

        {/* Header / Avatar */}
        <div className={cn("relative z-10", isCompactView ? "shrink-0" : "p-4 pb-0")}>
          <div className="flex justify-between items-start">
            <div className={cn("relative", isCompactView ? "h-10 w-10" : "h-16 w-16 mb-3")}>
              <Avatar className="h-full w-full ring-2 ring-white dark:ring-gray-800 shadow-sm transition-transform group-hover:scale-105 duration-300">
                <AvatarImage src={contact.photo_url || undefined} alt={contact.name} className="object-cover" />
                <AvatarFallback className={cn("text-white font-medium text-lg", getGradient(contact.name))}>
                  {getInitialsFromFullName(contact.name)}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={(e) => onToggleFavorite(contact.id, e)}
                className="absolute -bottom-1 -right-1 p-1.5 bg-white dark:bg-gray-800 rounded-full shadow-sm hover:scale-110 transition-transform z-20"
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
            
            {!isCompactView && (
               <div className="flex flex-col items-end gap-1">
                 {/* Only show "Connected" badge if mutuals > 0 (example logic) or based on tags */}
               </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className={cn("relative z-10 min-w-0 flex-1", isCompactView ? "" : "px-4 pb-4")}>
          <div className="mb-1">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {contact.name}
            </h3>
            {contact.job_title && !isCompactView && (
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
                {contact.job_title}
                {contact.company && <span className="text-gray-400"> at {contact.company}</span>}
              </p>
            )}
          </div>

          {!isCompactView && (
             <div className="space-y-2 mt-3">
               {/* Quick Info Grid */}
               <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400">
                 <div className="flex items-center gap-1.5 truncate" title="Last Contact">
                   <CalendarDays size={14} className="text-gray-400 shrink-0" />
                   <span className="truncate">{lastContact || "No contact yet"}</span>
                 </div>
                 {birthday && (
                   <div className="flex items-center gap-1.5 truncate" title="Birthday">
                     <Cake size={14} className="text-pink-400 shrink-0" />
                     <span className="truncate">{birthday}</span>
                   </div>
                 )}
               </div>

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {tags.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="secondary" className="bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 text-[10px] h-5 px-1.5 border-0">
                        {tag}
                      </Badge>
                    ))}
                    {tags.length > 3 && (
                      <Badge variant="secondary" className="bg-gray-50 dark:bg-gray-800 text-gray-500 text-[10px] h-5 px-1.5 border-0">
                        +{tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

               {mutualCount > 0 && (
                 <div className="flex items-center gap-1 mt-2 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                   <LinkIcon size={12} />
                   {mutualCount} mutual connection{mutualCount !== 1 ? 's' : ''}
                 </div>
               )}
             </div>
          )}
          
          {isCompactView && (
            <div className="flex gap-4 text-xs text-gray-500 ml-auto items-center">
               {birthday && (
                  <div className="hidden sm:flex items-center gap-1" title="Birthday">
                    <Cake size={12} className="text-pink-400" />
                    <span>{birthday}</span>
                  </div>
               )}
                <div className="hidden sm:flex items-center gap-1" title="Last Contact">
                   <CalendarDays size={12} className="text-gray-400" />
                   <span>{lastContact || "-"}</span>
                </div>
               <ChevronRight size={16} className="text-gray-300" />
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
