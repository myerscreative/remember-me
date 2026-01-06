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
  isCompactView: boolean;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  tags?: string[];
  mutualCount?: number; // New prop
}

export function SearchResultCard({ contact, isCompactView, onToggleFavorite, tags = [], mutualCount = 0 }: SearchResultCardProps) {
  
  // Format info helper
  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    try {
      return format(parseISO(dateString), 'MMM d, yyyy');
    } catch (e) {
      return dateString;
    }
  };

  const birthday = useMemo(() => {
    if (!contact.birthday) return null;
    try {
      // Append time to force local parsing or split and create date manually to avoid timezone shift
      // YYYY-MM-DD -> [YYYY, MM, DD]
      // Note: new Date("YYYY-MM-DD") is UTC, new Date(Y, M, D) is local
      const parts = contact.birthday.split('-');
      if (parts.length === 3) {
        const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
      }
      return new Date(contact.birthday).toLocaleDateString("en-US", { month: "long", day: "numeric" });
    } catch (e) {
      return contact.birthday;
    }
  }, [contact.birthday]);
  const lastContact = formatDate(contact.last_interaction_date);

  return (
    <Link
      href={`/contacts/${contact.id}`}
      className={cn(
        "group flex items-center gap-2 md:gap-3 bg-card dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200",
        isCompactView 
          ? "p-2 md:p-2.5" 
          : "p-4 md:p-5 items-start"
      )}
    >
      {/* Avatar with gradient */}
      <Avatar className={cn(
        "shrink-0",
        isCompactView 
          ? "h-10 w-10" 
          : "h-12 w-12 md:h-14 md:w-14"
      )}>
        <AvatarImage src={contact.photo_url || ""} />
        <AvatarFallback
          className={cn(
            "bg-gradient-to-br text-white font-semibold",
            isCompactView 
              ? "text-xs" 
              : "text-sm md:text-base",
            getGradient(contact.name)
          )}
        >
          {getInitialsFromFullName(contact.name)}
        </AvatarFallback>
      </Avatar>

      {/* Contact Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 md:gap-2">
          <h3 className={cn(
            "font-bold text-slate-900 dark:text-white leading-tight truncate",
            isCompactView 
              ? "text-sm" 
              : "text-base md:text-lg"
          )}>
            {contact.name}
          </h3>
          <button
            onClick={(e) => onToggleFavorite(contact.id, e)}
            className={cn(
              "shrink-0 transition-all duration-200 hover:scale-110",
              (contact as any).is_favorite ? "text-amber-500 dark:text-amber-400" : "text-slate-300 dark:text-slate-600 hover:text-amber-400"
            )}
            title={(contact as any).is_favorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Star
              className={cn(
                isCompactView ? "h-3.5 w-3.5" : "h-4 w-4 md:h-5 md:w-5",
                (contact as any).is_favorite && "fill-current"
              )}
            />
          </button>
           
           {/* Mutual Connection Badge */}
           {mutualCount > 0 && (
             <Badge variant="secondary" className="hidden sm:flex h-5 px-1.5 text-[10px] gap-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800">
               <LinkIcon size={10} />
               {mutualCount} Mutual
             </Badge>
           )}
        </div>
        
        {/* Info Row: Birthday & Last Contact */}
        <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500 dark:text-slate-400">
             {/* Birthday */}
             {birthday && (
                 <div className="flex items-center gap-1 text-pink-500/90 dark:text-pink-400/90 font-medium">
                   <Cake className="h-3 w-3" />
                   <span>{birthday}</span>
                 </div>
             )}
             
             {/* Last Contact */}
             <div className="flex items-center gap-1">
               <CalendarDays className="h-3 w-3 opacity-70" />
               <span>{lastContact || 'No recent contact'}</span>
             </div>
        </div>

        {/* Tags - Only show in expanded view or if very few? 
            User wanted "Standard View" to have tags, Compact to have Birthday/Last Contact replacing tags?
            Let's keep tags but limit them strictly in Compact. Or hide them if Birthday is present?
            Let's show 1 tag max in compact if space permits, or move to next line.
        */}
        {!isCompactView && (
             <div className="flex flex-wrap gap-1.5 md:gap-2 mt-2">
                {tags.slice(0, 3).map(tag => (
                  <span key={tag} className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded-sm border border-slate-200 dark:border-slate-700">
                     {tag}
                  </span>
                ))}
            </div>
        )}
      </div>

      {/* Chevron */}
      <ChevronRight className={cn(
        "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-400 shrink-0 transition-all duration-200 group-hover:translate-x-1",
        isCompactView 
          ? "h-4 w-4" 
          : "h-5 w-5 md:h-6 md:w-6",
        !isCompactView && "mt-1"
      )} />
    </Link>
  );
}
