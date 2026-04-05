import { Person } from '@/types/database.types';

interface RelationshipStatus {
  label: string;
  colorClass: string;
}

export function getRelationshipStatus(contact: Person): RelationshipStatus {
  const now = new Date();

  const toValidDate = (dateStr?: string | null): Date | null => {
    if (!dateStr) return null;
    const parsed = new Date(dateStr);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const getBaselineDate = (): Date | null => {
    const candidates = [
      toValidDate(contact.last_interaction_date),
      toValidDate(contact.last_contact),
      toValidDate(contact.created_at),
    ].filter((d): d is Date => d !== null);

    if (candidates.length === 0) return null;

    return candidates.reduce((latest, current) =>
      current.getTime() > latest.getTime() ? current : latest
    );
  };
  
  // 1. Check for upcoming Milestones (Birthdays in < 7 days)
  if (contact.birthday) {
    const birthday = new Date(contact.birthday);
    const nextBirthday = new Date(now.getFullYear(), birthday.getMonth(), birthday.getDate());
    
    // If birthday has passed this year, look at next year
    if (nextBirthday < now) {
      nextBirthday.setFullYear(now.getFullYear() + 1);
    }
    
    // Reset hours to compare dates only
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const nextBirthdayDate = new Date(nextBirthday.getFullYear(), nextBirthday.getMonth(), nextBirthday.getDate());
    
    const diffTime = nextBirthdayDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays >= 0 && diffDays <= 7) {
      const label = diffDays === 0 ? "Reach out for their birthday today!" : "Reach out for their upcoming milestone!";
      // Milestone Hook: "Reach out for their upcoming milestone!"
      return { label, colorClass: "text-indigo-500 dark:text-indigo-400 font-semibold text-[12px] font-sans" };
    }
  }

  // 2. Use most recent of last interaction/contact/created date as baseline.
  // This keeps brand-new contacts in their initial nurtured window.
  const baselineDate = getBaselineDate();

  if (!baselineDate) {
    return { label: "Initiate your first reach-out", colorClass: "text-indigo-500 dark:text-indigo-400 font-semibold text-[12px] font-sans" };
  }

  // 3. Check Overdue Status
  const diffTime = Math.abs(now.getTime() - baselineDate.getTime());
  const daysAgo = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // Custom thresholds
  let threshold = 30; // Default (Medium)
  if (contact.importance === 'high') threshold = 14;
  else if (contact.importance === 'medium') threshold = 30;
  else if (contact.importance === 'low') threshold = 90;

  if (daysAgo >= threshold) {
     // Check Severity for Drifting vs Neglected
     // Buffer of 30 days past threshold = Neglected
     if (daysAgo >= threshold + 30) {
        return { label: "Drifting", colorClass: "font-medium text-[12px] font-sans" };
     } else {
        return { label: "Needs some love", colorClass: "font-medium text-[12px] font-sans" };
     }
  }

  // 4. Up to Date (Slate - No suggested action)
  return { label: "Up to Date", colorClass: "text-slate-500 dark:text-slate-400 font-sans text-xs" };
}
