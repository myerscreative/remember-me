
import { formatDistanceToNow, parseISO, differenceInDays, isToday, addYears, setYear, isPast, isValid } from "date-fns";

/**
 * Calculates days until the next birthday.
 * Returns 0 if today.
 */
export function getDaysUntilBirthday(birthdayString: string | null): number {
  if (!birthdayString) return 999;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize today
  
  const birthdayDate = parseISO(birthdayString);
  if (!isValid(birthdayDate)) return 999;

  const currentYear = today.getFullYear();
  let nextBirthday = setYear(birthdayDate, currentYear);
  nextBirthday.setHours(0, 0, 0, 0);

  // If birthday has passed this year, look at next year
  if (isPast(nextBirthday) && !isToday(nextBirthday)) {
    nextBirthday = addYears(nextBirthday, 1);
  }

  return differenceInDays(nextBirthday, today);
}

export type BirthdayDisplayState = 'today' | 'upcoming' | 'distant' | 'none';

export function getBirthdayDisplayInfo(birthdayString: string | null): { 
  state: BirthdayDisplayState; 
  text: string; 
  dateFormatted: string;
} {
  if (!birthdayString) {
    return { state: 'none', text: '', dateFormatted: '' };
  }

  const daysUsing = getDaysUntilBirthday(birthdayString);
  const birthdayDate = parseISO(birthdayString);
  
  // Format like "Dec 27" or "Mar 15"
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dateFormatted = `${monthNames[birthdayDate.getUTCMonth()]} ${birthdayDate.getUTCDate()}`;

  if (daysUsing === 0) {
    return { state: 'today', text: 'Today!', dateFormatted };
  } else if (daysUsing <= 30) {
    return { state: 'upcoming', text: dateFormatted, dateFormatted };
  } else {
    return { state: 'distant', text: dateFormatted, dateFormatted };
  }
}

/**
 * Returns a human-friendly "Last Contact" string
 */
export function getLastContactText(dateString: string | null): string {
  if (!dateString) return "No contact";
  
  const date = parseISO(dateString);
  if (!isValid(date)) return "No contact";

  return formatDistanceToNow(date, { addSuffix: true });
}

export interface StatusConfig {
  text: string;
  colorClass: string; 
  dotClass: string;
}

/**
 * Determines the health status based on last contact and target frequency
 */
export function getStatusConfig(lastContactDate: string | null, frequency: number | null): StatusConfig {
  // Mapping frequency enum/string to days is handled elsewhere or assumed to be passed as days here.
  // The Person type in database.types.ts has target_frequency_days: number | null
  
  if (!lastContactDate) {
    return {
      text: "Never",
      colorClass: "text-slate-500 dark:text-slate-400",
      dotClass: "bg-slate-500 dark:bg-slate-400"
    };
  }

  if (!frequency) {
     // If no frequency set, arguably it's "On track" or just neutral.
     // Let's treat it as neutral/good for now, or maybe just show the last contact time without strong urgent status.
     return {
        text: "No cadence",
        colorClass: "text-slate-400",
        dotClass: "bg-slate-400"
     };
  }

  const daysSince = differenceInDays(new Date(), parseISO(lastContactDate));
  const diff = frequency - daysSince;

  if (diff < 0) {
    // Overdue
    const daysOverdue = Math.abs(diff);
    return {
      text: `${daysOverdue}d overdue`,
      colorClass: "text-red-500 dark:text-red-400",
      dotClass: "bg-red-500 dark:bg-red-400"
    };
  } else if (diff <= 7 && frequency >= 14) { 
    // Due soon (only if frequency is at least 2 weeks, otherwise it's always due soon)
    return {
      text: `Due in ${diff}d`,
      colorClass: "text-amber-500 dark:text-amber-400",
      dotClass: "bg-amber-500 dark:bg-amber-400"
    };
  } else {
    // On track
    return {
      text: "On track",
      colorClass: "text-emerald-500 dark:text-emerald-400",
      dotClass: "bg-emerald-500 dark:bg-emerald-400"
    };
  }
}

/**
 * Helper to get frequency label from days
 */
export function getFrequencyLabel(days: number | null): string {
  if (!days) return "None";
  if (days <= 7) return "Weekly";
  if (days <= 14) return "Bi-weekly";
  if (days <= 30) return "Monthly";
  if (days <= 90) return "Quarterly";
  if (days <= 180) return "Twice a year";
  return "Yearly";
}

/**
 * Safe formatter for calendar event dates
 * Handles undefined/null inputs and invalid dates
 */
export function formatCalendarDate(dateTime?: string | null): string {
  if (!dateTime) return "No date available";

  try {
    const date = new Date(dateTime);
    if (isNaN(date.getTime())) return "Invalid date";

    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return "Date error";
  }
}

/**
 * Safe formatter for calendar event time
 * Handles undefined/null inputs and invalid dates
 */
export function formatCalendarTime(dateTime?: string | null): string {
  if (!dateTime) return "All-day";

  try {
    const date = new Date(dateTime);
    if (isNaN(date.getTime())) return "Invalid time";

    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return "Time error";
  }
}

/**
 * Calculates relative time until a calendar event
 */
export function getTimeUntilCalendar(dateTime?: string | null): string {
  if (!dateTime) return "—";

  try {
    const eventDate = new Date(dateTime);
    if (isNaN(eventDate.getTime())) return "Invalid";

    const now = new Date();
    const diff = eventDate.getTime() - now.getTime();

    if (diff < 0) return "Started";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours < 1) return `In ${minutes} minutes`;
    if (hours < 24) return `In ${hours} hours`;
    
    const days = Math.floor(hours / 24);
    return `In ${days} ${days === 1 ? 'day' : 'days'}`;
  } catch {
    return "—";
  }
}
