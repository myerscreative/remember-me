import React from 'react';
import Image from 'next/image';
import { Contact } from '../mockContacts';
import { MatchLevel } from '../utils/matchUtils';
import { Plus, Info } from 'lucide-react';
import { calculateDaysAgo, getContactStatus, formatRelativeTime, getShortRelativeTime, getMethodIcon, getMethodLabel } from '../utils/dateUtils';
import { getMicroSummaryForList } from '@/lib/utils/summary-levels';

interface ContactCardProps {
  contact: Contact;
  matchLevel: MatchLevel;
  sharedInterests?: string[];
  matchCount?: number;
  viewMode: 'compact' | 'standard' | 'detailed';
  hasSelection: boolean;
  onSelect: (contact: Contact) => void;
  onPreview: (contact: Contact) => void;
}

export default function ContactCard({ contact, matchLevel, sharedInterests = [], matchCount = 0, viewMode, hasSelection, onSelect, onPreview }: ContactCardProps) {
  const isSelected = matchLevel === 'selected';
  const isStrong = matchLevel === 'strong';
  const isMedium = matchLevel === 'medium';
  
  // Dim ONLY if there is a selection active AND this card is not matched/selected
  const isDimmed = hasSelection && matchLevel === 'none';

  // Base Styles (Default State)
  let borderColor = 'border-[#e5e7eb] border-2';
  let bgColor = 'bg-white';
  let avatarBg = '#8b5cf6'; // Default Purple
  const opacityClass = isDimmed ? 'opacity-30' : 'opacity-100';

  // Override styles based on state
  if (isSelected) {
    borderColor = 'border-[#6366f1] border-2'; // Blue
    bgColor = 'bg-[#f0f9ff]'; // Light Blue
    avatarBg = '#6366f1'; // Blue
  } else if (isStrong) {
    borderColor = 'border-[#10b981] border-2'; // Green
    bgColor = 'bg-linear-to-br from-[#f0fdf4] to-[#dcfce7]'; // Green Gradient
    avatarBg = '#10b981'; // Green
  } else if (isMedium) {
    borderColor = 'border-[#fbbf24] border-2'; // Yellow
    bgColor = 'bg-linear-to-br from-[#fef3c7] to-[#fde68a]'; // Yellow Gradient
    avatarBg = '#fbbf24'; // Yellow
  }

  // Badge Logic
  const showBadge = isStrong || isMedium;
  const badgeColor = isStrong ? 'bg-[#10b981]' : 'bg-[#fbbf24]';
  const badgeText = isStrong ? '2+' : '1';
  
  // Shared Interest Text for Standard/Detailed views
  const sharedText = sharedInterests.length > 0 ? sharedInterests.join(', ') : '';

  // Last Contact Logic
  const daysAgo = calculateDaysAgo(contact.lastContact?.date);
  const status = getContactStatus(daysAgo);
  const methodIcon = getMethodIcon(contact.lastContact?.method);
  const methodLabel = getMethodLabel(contact.lastContact?.method);
  const relativeTime = formatRelativeTime(daysAgo);
  const shortTime = getShortRelativeTime(daysAgo);

  // Status Styling
  let statusColorClass = 'text-gray-500 bg-gray-50 border-gray-200';
  if (status === 'good') statusColorClass = 'text-green-800 bg-green-50 border-green-200';
  else if (status === 'warning') statusColorClass = 'text-yellow-800 bg-yellow-50 border-yellow-200';
  else if (status === 'overdue') statusColorClass = 'text-red-800 bg-red-50 border-red-200';

  const showStatusWarning = status === 'overdue' || status === 'warning';

  const avatarSize = viewMode === 'compact' ? 12 : viewMode === 'standard' ? 14 : 16; 

  return (
    <div
      className={`group rounded-xl ${borderColor} ${bgColor} p-4 cursor-pointer transition-all hover:shadow-lg ${opacityClass} relative`}
      onClick={() => onSelect(contact)}
      role="button"
      aria-pressed={isSelected}
      aria-label={`${contact.name}, ${matchLevel} match, last contact ${relativeTime}`}
      title={viewMode === 'compact' && showBadge ? `${matchCount} shared: ${sharedText}` : undefined}
    >
      {/* Avatar */}
      <div
        className="flex items-center justify-center rounded-full mx-auto mb-2 text-white font-semibold shadow-sm"
        style={{ backgroundColor: avatarBg, width: `${avatarSize * 0.25}rem`, height: `${avatarSize * 0.25}rem` }}
      >
        {contact.photo ? (
          <Image src={contact.photo} alt={contact.name} width={avatarSize * 4} height={avatarSize * 4} className="rounded-full object-cover" />
        ) : (
          contact.initials
        )}
      </div>

      {/* Name */}
      <div className="text-center text-[#111827] font-medium text-sm truncate" title={contact.name}>
        {contact.name}
      </div>

      {/* Role */}
      {(viewMode === 'standard' || viewMode === 'detailed') && (
        <div className="text-center text-[#6b7280] text-xs truncate" title={contact.role}>
          {contact.role}
        </div>
      )}

      {/* Micro Summary - Always use micro level for list views */}
      {(viewMode === 'standard' || viewMode === 'detailed') && (() => {
        const microSummary = getMicroSummaryForList(contact as any);
        if (microSummary) {
          return (
            <div className="mt-2 text-center text-[11px] text-[#6b7280] line-clamp-2 px-1" title={microSummary}>
              {microSummary}
            </div>
          );
        }
        return null;
      })()}
      
      {/* Compact/Standard Last Contact Info */}
      {viewMode === 'compact' && (
        <div className={`mt-1 text-center text-[10px] font-medium ${showStatusWarning ? 'text-red-600' : 'text-gray-500'}`}>
          {methodIcon} {shortTime}
        </div>
      )}
      
      {viewMode === 'standard' && (
        <>
          <div className={`mt-2 text-center text-xs font-medium py-1 px-2 rounded-full border ${statusColorClass} inline-block w-full truncate`}>
             {methodIcon} {methodLabel} {shortTime} {status === 'overdue' && '⚠️'}
          </div>
          {/* Shared Interest Label */}
          {showBadge && (
            <div className="mt-2 text-center text-xs truncate font-medium text-gray-700">
              {isStrong ? '🎯' : '🤝'} {sharedText}
            </div>
          )}
        </>
      )}

      {/* Detail Info Icon */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onPreview(contact);
        }}
        className="absolute top-3 left-3 w-6 h-6 rounded-full bg-white/90 border border-gray-200 text-indigo-500 hover:bg-indigo-600 hover:text-white flex items-center justify-center transition-all z-10 shadow-sm"
        aria-label="View details"
      >
        <Info size={14} strokeWidth={2.5} />
      </button>

      {/* Match badge */}
      {showBadge && (
        <div
          className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${badgeColor} text-white shadow-sm ring-2 ring-white`}
        >
          {badgeText}
        </div>
      )}

      {/* Selected label */}
      {isSelected && (
        <div className="absolute top-2 right-2 bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-medium border border-indigo-200">
          👆 Selected
        </div>
      )}

      {/* Detailed View Content */}
      {viewMode === 'detailed' && (
        <div className="mt-3 space-y-2">
           {/* Last Contact Box */}
           <div className={`text-xs p-2 rounded-lg border ${statusColorClass} flex flex-col items-center gap-1`}>
             <div className="font-semibold flex items-center gap-1">
               {methodIcon} {methodLabel}
             </div>
             <div className="opacity-90">
               {relativeTime} {status === 'overdue' && '⚠️'}
             </div>
           </div>
           
           {/* Interests */}
           <div className="flex flex-wrap justify-center gap-1">
            {contact.interests.map((interest, idx) => {
              const isMatch = sharedInterests.includes(interest);
              
              let tagClass = 'bg-[#f3f4f6] text-[#4b5563]';
              let content = interest;
              
              if (isMatch) {
                if (isStrong) {
                  tagClass = 'bg-[#10b981] text-white font-bold';
                  content = `✨ ${interest}`;
                } else if (isMedium) {
                  tagClass = 'bg-[#fbbf24] text-white font-bold';
                  content = `✨ ${interest}`;
                }
              }
              
              return (
                <span
                  key={idx}
                  className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-xs ${tagClass}`}
                >
                  {!isMatch && <Plus className="w-3 h-3 mr-1" />}
                  {content}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
