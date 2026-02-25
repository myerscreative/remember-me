import { Person } from '@/types/database.types';

interface RelationshipStatus {
  label: string;
  colorClass: string;
}

export function getRelationshipStatus(contact: Person): RelationshipStatus {
  const now = new Date();
  
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

  // 2. Check if last_contact_date is NULL (New Contact Logic)
  const lastContactStr = contact.last_interaction_date || contact.last_contact;
  
  if (!lastContactStr) {
    return { label: "Initiate your first reach-out", colorClass: "text-indigo-500 dark:text-indigo-400 font-semibold text-[12px] font-sans" };
  }

  // 3. Check Overdue Status
  const lastContactDate = new Date(lastContactStr);
  const diffTime = Math.abs(now.getTime() - lastContactDate.getTime());
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
        return { label: "Nurture this connection", colorClass: "text-red-500 dark:text-red-400 font-semibold text-[12px] font-sans" };
     } else {
        return { label: "Reconnect with this drifting contact", colorClass: "text-amber-500 dark:text-amber-400 font-semibold text-[12px] font-sans" };
     }
  }

  // 4. Up to Date (Slate - No suggested action)
  return { label: "Up to Date", colorClass: "text-slate-500 dark:text-slate-400 font-sans text-xs" };
}
