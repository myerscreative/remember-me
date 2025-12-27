import React from 'react';
import { Phone, Mail, Video, MessageSquare } from 'lucide-react';

/**
 * Returns the appropriate icon component for a given interaction method.
 * @param method - The interaction method (e.g., 'phone', 'email', 'video')
 * @returns JSX.Element (Lucide Icon)
 */
export const getMethodIcon = (method?: string | null) => {
  switch(method?.toLowerCase()) {
      case 'phone': return <Phone className="h-3 w-3" />;
      case 'email': return <Mail className="h-3 w-3" />;
      case 'video': return <Video className="h-3 w-3" />;
      default: return <MessageSquare className="h-3 w-3" />;
  }
};

/**
 * Formats a date string into a "Last seen" text representation.
 * @param dateStr - ISO date string
 * @returns Formatted string (e.g., "Oct 24" or "Never")
 */
export const getLastSeenText = (dateStr?: string | null) => {
  if (!dateStr) return 'Never';
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};
