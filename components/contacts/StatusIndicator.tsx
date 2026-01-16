import React from 'react';
import { getRelationshipStatus, Contact } from '@/lib/contacts/contact-utils';
import { cn } from '@/lib/utils';

interface StatusIndicatorProps {
  lastContactDate: string | null | undefined;
  frequency: Contact['contact_frequency'];
  className?: string;
  hideText?: boolean;
}

export function StatusIndicator({ 
  lastContactDate, 
  frequency, 
  className,
  hideText = false
}: StatusIndicatorProps) {
  const { label, color } = getRelationshipStatus(lastContactDate, frequency);

  return (
    <div className={cn("flex items-center gap-2 justify-end", className)}>
      {!hideText && (
        <span 
          className="text-[13px] md:text-sm font-semibold text-right" 
          style={{ color }}
        >
          {label}
        </span>
      )}
      <div 
        className="w-2 h-2 md:w-[10px] md:h-[10px] rounded-full flex-shrink-0" 
        style={{ backgroundColor: color }}
      />
    </div>
  );
}
