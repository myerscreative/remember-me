import React from 'react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BirthdayBadge } from './BirthdayBadge';
import { StatusIndicator } from './StatusIndicator';
import { Contact, getBirthdayInfo, getRelationshipEmoji, getInitials, FREQUENCY_LABELS, isEmoji } from '@/lib/contacts/contact-utils';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface ContactCardProps {
  contact: Contact;
}

export function ContactCard({ contact }: ContactCardProps) {
  const bdayInfo = getBirthdayInfo(contact.birthday);
  const initials = getInitials(contact.name);
  const relationshipEmoji = getRelationshipEmoji(contact.relationship_level);
  const isAvatarEmoji = isEmoji(contact.avatar_url);

  return (
    <Link 
      href={`/people/${contact.id}`}
      className="flex flex-col gap-3 p-4 bg-[#1a1f2e] rounded-2xl cursor-pointer active:bg-[#242938] transition-all duration-200 active:scale-[0.98] border border-transparent"
    >
      {/* Row 1: Avatar + Name + Status */}
      <div className="flex items-center gap-3">
        <div className="relative flex-shrink-0">
          <Avatar className="w-12 h-12 border-2 border-[#3d4758]">
            {!isAvatarEmoji && contact.avatar_url && (
              <AvatarImage src={contact.avatar_url} alt={contact.name} />
            )}
            <AvatarFallback className="bg-[#2d3748] text-white text-[17px] font-semibold">
              {isAvatarEmoji ? <span className="text-[22px]">{contact.avatar_url}</span> : initials}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[#1a1f2e] rounded-full flex items-center justify-center text-[10px] border-2 border-[#1a1f2e]">
            {relationshipEmoji}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-[18px] text-[#e2e8f0] truncate leading-tight">
              {contact.name}
            </h3>
            {bdayInfo && bdayInfo.type !== 'distant' && (
              <BirthdayBadge birthday={contact.birthday} />
            )}
          </div>
          {bdayInfo?.type === 'distant' && (
            <BirthdayBadge birthday={contact.birthday} />
          )}
        </div>

        <StatusIndicator 
          lastContactDate={contact.last_contact_date} 
          frequency={contact.contact_frequency} 
          className="shrink-0"
        />
      </div>
      
      {/* Row 2: Last Contact / Frequency */}
      <div className="flex items-center gap-2 pl-[60px]">
        <div className="text-[13px] text-[#94a3b8] flex items-center gap-1">
          <span className="text-[#64748b]">Last:</span>
          {contact.last_contact_date 
            ? formatDistanceToNow(new Date(contact.last_contact_date), { addSuffix: true })
            : "No contact"
          }
        </div>
        <span className="text-sm text-[#3d4758]">/</span>
        <div className="text-[13px] text-[#94a3b8]">
          {FREQUENCY_LABELS[contact.contact_frequency]}
        </div>
      </div>
    </Link>
  );
}
