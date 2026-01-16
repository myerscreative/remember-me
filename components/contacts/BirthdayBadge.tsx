import React from 'react';
import { getBirthdayInfo } from '@/lib/contacts/contact-utils';
import { cn } from '@/lib/utils';

interface BirthdayBadgeProps {
  birthday: string | null | undefined;
  className?: string;
}

export function BirthdayBadge({ birthday, className }: BirthdayBadgeProps) {
  const info = getBirthdayInfo(birthday);
  
  if (!info) return null;

  if (info.type === 'distant') {
    return (
      <span className={cn("text-[12px] text-[#64748b] leading-tight", className)}>
        {info.label}
      </span>
    );
  }

  return (
    <span 
      className={cn(
        "text-[13px] whitespace-nowrap leading-none",
        info.type === 'today' ? "text-[#ef4444] font-semibold" : "text-[#f59e0b] font-medium",
        className
      )}
    >
      {info.label}
    </span>
  );
}
