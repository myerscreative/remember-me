import React from 'react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BirthdayBadge } from './BirthdayBadge';
import { StatusIndicator } from './StatusIndicator';
import { Contact, getBirthdayInfo, getRelationshipEmoji, getInitials, FREQUENCY_LABELS, isEmoji } from '@/lib/contacts/contact-utils';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface ContactRowProps {
  contact: Contact;
}

export function ContactRow({ contact }: ContactRowProps) {
  const bdayInfo = getBirthdayInfo(contact.birthday);
  const initials = getInitials(contact.name);
  const relationshipEmoji = getRelationshipEmoji(contact.relationship_level);
  const isAvatarEmoji = isEmoji(contact.avatar_url);

  return (
    <Link 
      href={`/people/${contact.id}`}
      className="group grid grid-cols-[auto_1fr_200px_180px_160px] gap-6 items-center px-6 py-[18px] border-b border-[#1a1f2e] hover:bg-[#1a1f2e] transition-all duration-200 cursor-pointer"
    >
      {/* Column 1: Avatar */}
      <div className="relative">
        <Avatar className="w-12 h-12 border-2 border-[#3d4758]">
          {!isAvatarEmoji && contact.avatar_url && (
            <AvatarImage src={contact.avatar_url} alt={contact.name} />
          )}
          <AvatarFallback className="bg-[#2d3748] text-white text-[17px] font-semibold">
            {isAvatarEmoji ? <span className="text-[22px]">{contact.avatar_url}</span> : initials}
          </AvatarFallback>
        </Avatar>
        <div className="absolute -bottom-0.5 -right-0.5 w-[18px] h-[18px] bg-[#0a0e1a] rounded-full flex items-center justify-center text-[11px] border-2 border-[#0a0e1a]">
          {relationshipEmoji}
        </div>
      </div>

      {/* Column 2: Name & Birthday */}
      <div className="flex items-center gap-[10px] min-w-0">
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-[16px] font-semibold text-[#e2e8f0] truncate">
            {contact.name}
          </span>
          {bdayInfo?.type === 'distant' && (
            <BirthdayBadge birthday={contact.birthday} />
          )}
        </div>
        {bdayInfo && bdayInfo.type !== 'distant' && (
          <BirthdayBadge birthday={contact.birthday} />
        )}
      </div>

      {/* Column 3: Last Contact */}
      <div className={cn(
        "text-sm font-medium",
        contact.last_contact_date ? "text-[#cbd5e1]" : "text-[#64748b]"
      )}>
        {contact.last_contact_date 
          ? formatDistanceToNow(new Date(contact.last_contact_date), { addSuffix: true })
          : "No contact"
        }
      </div>

      {/* Column 4: Frequency */}
      <div className="text-sm text-[#94a3b8]">
        {FREQUENCY_LABELS[contact.contact_frequency]}
      </div>

      {/* Column 5: Status */}
      <StatusIndicator 
        lastContactDate={contact.last_contact_date} 
        frequency={contact.contact_frequency} 
      />
    </Link>
  );
}
