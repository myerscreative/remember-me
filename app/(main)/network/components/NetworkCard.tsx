'use client';

import { Person } from '@/types/database.types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { CalendarDays, Cake, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { getRelationshipStatus } from '../utils/relationshipStatus';
import { FREQUENCY_PRESETS } from "@/lib/relationship-health";
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

interface NetworkCardProps {
  contact: Person;
  highlight?: string;
}

function highlightText(text: string, highlight?: string) {
  if (!highlight || !text) return <>{text}</>;
  const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <span key={i} className="bg-yellow-200 text-yellow-800 px-0.5 rounded">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </>
  );
}

export function NetworkCard({ contact, highlight }: NetworkCardProps) {
  const initials = contact.first_name?.[0] + (contact.last_name?.[0] || '');

  // Format dates helper
  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    try {
      return format(parseISO(dateString), 'MMM d, yyyy');
    } catch {
      return dateString;
    }
  };

  const birthday = formatDate(contact.birthday);
  const lastContact = formatDate(contact.last_interaction_date);

  return (
    <Link href={`/contacts/${contact.id}`}>
      <Card className="group relative overflow-hidden p-3 hover:shadow-md transition-all duration-300 border-white/20 bg-surface/40 hover:bg-surface/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-white/20">
            <AvatarImage src={contact.photo_url || undefined} alt={contact.name ?? "Contact"} />
            <AvatarFallback className="bg-indigo-100 text-indigo-600 text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
               <h4 className="font-semibold text-sm text-text-primary truncate">
                {highlightText(contact.name, highlight)}
              </h4>
            </div>
            
            {/* Context - Only show if very relevant or searching, otherwise keep it clean */}
            {(contact.where_met || contact.relationship_summary) && highlight && (
              <p className="text-[10px] text-text-tertiary line-clamp-1">
                {highlightText(contact.where_met || contact.relationship_summary || '', highlight)}
              </p>
            )}
            
            <div className="flex items-center gap-3 mt-1 text-[10px] text-text-tertiary">
               {/* Last Contact */}
               <div className="flex items-center gap-1">
                 <CalendarDays className="h-3 w-3 opacity-70" />
                 <span>{lastContact || 'No contact'}</span>
                 {contact.target_frequency_days && (
                   <span className="flex items-center gap-1 bg-black/5 px-1 rounded text-[9px] font-bold uppercase tracking-wider">
                      <RefreshCw className="h-2.5 w-2.5 opacity-60" />
                      {FREQUENCY_PRESETS.find(p => p.days === contact.target_frequency_days)?.label || "Custom"}
                   </span>
                 )}
               </div>
               
               {/* Birthday */}
               {birthday && (
                 <div className="flex items-center gap-1 text-pink-500/80">
                   <Cake className="h-3 w-3 opacity-70" />
                   <span>{birthday}</span>
                 </div>
               )}
            </div>

          </div>
          
           {/* Connection Indicator (Mini Dot) */}
           <div className={cn(
              "h-2 w-2 rounded-full",
              getRelationshipStatus(contact).colorClass.split(' ')[1]?.replace('text-', 'bg-') || 'bg-border-default'
            )} title={getRelationshipStatus(contact).label} />
        </div>
      </Card>
    </Link>
  );
}
