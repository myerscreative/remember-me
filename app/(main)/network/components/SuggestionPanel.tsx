import React from 'react';
import { Contact } from '../mockContacts';
import { calculateDaysAgo, formatRelativeTime, getMethodIcon } from '../utils/dateUtils';
import { cn } from '@/lib/utils';

interface SuggestionPanelProps {
  suggestions: Contact[];
}

export default function SuggestionPanel({ suggestions }: SuggestionPanelProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-surface rounded-lg shadow-xl border border-border-default overflow-hidden transform transition-all duration-300 z-50">
      <div className="p-4 bg-indigo-50 border-b border-indigo-100 flex justify-between items-center">
        <h3 className="font-semibold text-indigo-900">Suggested Connections</h3>
        <span className="bg-indigo-200 text-indigo-800 text-xs px-2 py-1 rounded-full">{suggestions.length}</span>
      </div>
      <div className="max-h-60 overflow-y-auto">
        {suggestions.map(contact => {
          const daysAgo = calculateDaysAgo(contact.lastContact?.date);
          const timeText = formatRelativeTime(daysAgo);
          const icon = getMethodIcon(contact.lastContact?.method);
          const isOverdue = daysAgo !== null && daysAgo > 30;
          const isRecent = daysAgo !== null && daysAgo <= 14;
          
          return (
            <div key={contact.id} className="p-3 border-b border-border-default hover:bg-subtle flex items-center gap-3 cursor-pointer">
               <div className="w-10 h-10 rounded-full bg-subtle shrink-0 overflow-hidden flex items-center justify-center text-text-tertiary font-medium">
                  {contact.photo ? (
                    <img src={contact.photo} alt={contact.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{contact.initials}</span>
                  )}
               </div>
               <div className="min-w-0">
                 <p className="text-sm font-medium text-text-primary truncate">{contact.name}</p>
                 <p className="text-xs text-text-tertiary truncate">{contact.role}</p>
                 {/* Last Contact Info */}
                 <p className={cn("mt-0.5 flex items-center gap-1 text-[10px]", isOverdue ? "font-medium text-red-600" : "text-text-tertiary")}>
                    {icon} {timeText} {isOverdue && '⚠️'} {isRecent && '✓'}
                 </p>
               </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
