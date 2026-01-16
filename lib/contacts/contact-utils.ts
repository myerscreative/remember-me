import { format, differenceInDays, addDays, isSameDay } from 'date-fns';

export type RelationshipStatus = 'overdue' | 'due-soon' | 'on-track' | 'never';

export interface Contact {
  id: string;
  name: string;
  avatar_url?: string | null;
  relationship_level: 'favorites' | 'friends' | 'contacts';
  birthday?: string | null;
  last_contact_date?: string | null;
  contact_frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'biannual';
}

export const FREQUENCY_DAYS_MAP = {
  weekly: 7,
  biweekly: 14,
  monthly: 30,
  quarterly: 90,
  biannual: 182,
};

export const FREQUENCY_LABELS = {
  weekly: 'Weekly',
  biweekly: 'Bi-weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  biannual: 'Twice a year',
};

/**
 * Calculate birthday display logic:
 * - If birthday is TODAY: "Today!" (Red)
 * - If birthday is within 30 days: "Jan 15" (Orange)
 * - If birthday is > 30 days: "Mar 15" (Gray, under name)
 */
export function getBirthdayInfo(birthdayStr: string | null | undefined) {
  if (!birthdayStr) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const bday = new Date(birthdayStr);
  const thisYear = today.getFullYear();
  let bdayThisYear = new Date(thisYear, bday.getMonth(), bday.getDate());

  if (bdayThisYear < today && !isSameDay(bdayThisYear, today)) {
    bdayThisYear = new Date(thisYear + 1, bday.getMonth(), bday.getDate());
  }

  const daysUntil = Math.ceil((bdayThisYear.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (isSameDay(bdayThisYear, today)) {
    return {
      type: 'today' as const,
      label: '🎂 Today!',
      color: '#ef4444',
      dateLabel: format(bdayThisYear, 'MMM d'),
    };
  } else if (daysUntil <= 30) {
    return {
      type: 'upcoming' as const,
      label: `🎂 ${format(bdayThisYear, 'MMM d')}`,
      color: '#f59e0b',
      dateLabel: format(bdayThisYear, 'MMM d'),
    };
  } else {
    return {
      type: 'distant' as const,
      label: `🎂 ${format(bdayThisYear, 'MMM d')}`,
      color: '#64748b',
      dateLabel: format(bdayThisYear, 'MMM d'),
    };
  }
}

/**
 * Calculate status based on last_contact_date + frequency
 */
export function getRelationshipStatus(
  lastContactDate: string | null | undefined,
  frequency: Contact['contact_frequency']
): { status: RelationshipStatus; label: string; color: string; daysRemaining?: number } {
  if (!lastContactDate) {
    return { status: 'never', label: 'Never', color: '#64748b' };
  }

  const last = new Date(lastContactDate);
  const now = new Date();
  const targetDays = FREQUENCY_DAYS_MAP[frequency];
  const nextContactDate = addDays(last, targetDays);
  
  const diff = differenceInDays(nextContactDate, now);

  if (diff < 0) {
    return { 
      status: 'overdue', 
      label: `${Math.abs(diff)}d overdue`, 
      color: '#ef4444',
      daysRemaining: diff 
    };
  } else if (diff <= 14) {
    return { 
      status: 'due-soon', 
      label: `Due ${diff}d`, 
      color: '#f59e0b',
      daysRemaining: diff 
    };
  } else {
    return { 
      status: 'on-track', 
      label: 'On track', 
      color: '#10b981',
      daysRemaining: diff 
    };
  }
}

export function getRelationshipEmoji(level: Contact['relationship_level']) {
  switch (level) {
    case 'favorites': return '⭐';
    case 'friends': return '👤';
    case 'contacts': return '🪪';
    default: return '👤';
  }
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function isEmoji(str: string | null | undefined): boolean {
  if (!str) return false;
  // Simple regex for common emojis, including flags
  const emojiRegex = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/;
  return emojiRegex.test(str) && str.length <= 4; // Flags can be 4 chars in some encodings
}
