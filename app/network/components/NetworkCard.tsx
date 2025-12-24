'use client';

import { Person } from '@/types/database.types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { CalendarDays, GitBranch } from 'lucide-react';
import Link from 'next/link';

interface NetworkCardProps {
  contact: Person;
  highlight?: string;
}

export function NetworkCard({ contact, highlight }: NetworkCardProps) {
  // Helper to highlight text
  const HighlightText = ({ text }: { text: string }) => {
    if (!highlight || !text) return <>{text}</>;
    
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === highlight.toLowerCase() ? (
            <span key={i} className="bg-yellow-200 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100 px-0.5 rounded">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </>
    );
  };

  const initials = contact.first_name?.[0] + (contact.last_name?.[0] || '');

  return (
    <Link href={`/contacts/${contact.id}`}>
      <Card className="group relative overflow-hidden p-4 hover:shadow-lg transition-all duration-300 border-white/20 bg-white/40 dark:bg-black/20 hover:bg-white/60 dark:hover:bg-black/40 backdrop-blur-md">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12 border-2 border-white/20">
            <AvatarImage src={contact.photo_url || undefined} />
            <AvatarFallback className="bg-indigo-100 text-indigo-600">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 dark:text-white truncate">
              <HighlightText text={contact.name} />
            </h4>
            
            {/* Context / Where met */}
            {(contact.where_met || contact.relationship_summary) && (
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                <HighlightText text={contact.where_met || contact.relationship_summary || ''} />
              </p>
            )}

            {/* Interests Badges */}
            {contact.interests && contact.interests.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {contact.interests.slice(0, 2).map((interest, i) => (
                  <Badge 
                    key={i} 
                    variant="secondary" 
                    className="text-[10px] px-1.5 h-5 bg-white/50 dark:bg-white/10"
                  >
                    <HighlightText text={interest} />
                  </Badge>
                ))}
                {contact.interests.length > 2 && (
                  <span className="text-[10px] text-gray-400 flex items-center">
                    +{contact.interests.length - 2}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/10 flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-1.5">
             <CalendarDays className="h-3 w-3" />
             <span>
               {contact.last_interaction_date 
                 ? new Date(contact.last_interaction_date).toLocaleDateString()
                 : 'No recent contact'}
             </span>
          </div>
          
          {/* Connection Indicator (Visual only for now) */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-indigo-400">
            <GitBranch className="h-3 w-3" />
            <span>Map</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
