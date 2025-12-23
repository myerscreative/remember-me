export type ContactStatus = 'good' | 'warning' | 'overdue' | 'never';

export function calculateDaysAgo(dateString?: string): number | null {
  if (!dateString) return null;
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  return diffDays;
}

export function getContactStatus(daysAgo: number | null): ContactStatus {
  if (daysAgo === null) return 'never';
  if (daysAgo <= 14) return 'good';
  if (daysAgo <= 30) return 'warning'; // Using 30 to align slightly better with "month" mental model, though prompt said 2-4 weeks (28 days). 30 is safer for "Last month".
  return 'overdue';
}

export function formatRelativeTime(daysAgo: number | null): string {
  if (daysAgo === null) return 'No contact yet';
  if (daysAgo === 0) return 'Today';
  if (daysAgo === 1) return 'Yesterday';
  if (daysAgo < 7) return `${daysAgo} days ago`;
  if (daysAgo < 14) return 'Last week';
  if (daysAgo < 21) return '2 weeks ago';
  if (daysAgo < 28) return '3 weeks ago';
  if (daysAgo < 60) return 'Last month';
  if (daysAgo < 90) return '2 months ago';
  if (daysAgo < 180) return '3-6 months ago';
  if (daysAgo < 365) return '6-12 months ago';
  return 'Over a year ago';
}

export function getShortRelativeTime(daysAgo: number | null): string {
  if (daysAgo === null) return 'Never';
  if (daysAgo === 0) return 'Today';
  if (daysAgo === 1) return 'Yest';
  if (daysAgo < 7) return `${daysAgo}d ago`;
  if (daysAgo < 14) return '1w ago';
  if (daysAgo < 21) return '2w ago';
  if (daysAgo < 28) return '3w ago';
  if (daysAgo < 60) return '1mo ago';
  if (daysAgo < 365) return `${Math.floor(daysAgo / 30)}mo ago`;
  return '1y+ ago';
}

export function getMethodIcon(method?: string): string {
  switch (method) {
    case 'phone': return '📞';
    case 'email': return '✉️';
    case 'text': return '💬';
    case 'in-person': return '☕';
    case 'video': return '📹';
    case 'linkedin': return '💼';
    default: return '👋';
  }
}

export function getMethodLabel(method?: string): string {
  switch (method) {
    case 'phone': return 'Called';
    case 'email': return 'Emailed';
    case 'text': return 'Texted';
    case 'in-person': return 'Met';
    case 'video': return 'Video called';
    case 'linkedin': return 'Messaged';
    default: return 'Contacted';
  }
}
