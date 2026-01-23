import React from 'react';
import { Contact } from '../mockContacts';
import { calculateDaysAgo, formatRelativeTime, getMethodIcon } from '../utils/dateUtils';

interface SuggestionPanelProps {
  suggestions: Contact[];
}

export default function SuggestionPanel({ suggestions }: SuggestionPanelProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden transform transition-all duration-300 z-50">
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
            <div key={contact.id} className="p-3 border-b border-gray-100 hover:bg-gray-50 flex items-center gap-3 cursor-pointer">
               <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0 overflow-hidden flex items-center justify-center text-gray-500 font-medium">
                  {contact.photo ? (
                    <img src={contact.photo} alt={contact.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{contact.initials}</span>
                  )}
               </div>
               <div className="min-w-0">
                 <p className="text-sm font-medium text-gray-900 truncate">{contact.name}</p>
                 <p className="text-xs text-gray-500 truncate">{contact.role}</p>
                 {/* Last Contact Info */}
                 <p className={`text-[10px] mt-0.5 flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
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
