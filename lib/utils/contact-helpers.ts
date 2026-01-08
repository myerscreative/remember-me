/**
 * Shared utility functions for contact management
 */

/**
 * Get initials from a name (first and last name)
 * @param firstName - The first name
 * @param lastName - The last name (optional)
 * @returns Initials (e.g., "JD" for "John Doe")
 */
export function getInitials(firstName: string, lastName: string | null = null): string {
  if (!firstName) return "";
  const firstInitial = firstName.trim()[0]?.toUpperCase() || "";
  const lastInitial = lastName?.trim()[0]?.toUpperCase() || "";
  return (firstInitial + lastInitial) || firstName.substring(0, 2).toUpperCase();
}

/**
 * Get initials from a full name string
 * @param name - The full name (e.g., "John Doe")
 * @returns Initials (e.g., "JD")
 */
export function getInitialsFromFullName(name: string): string {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

/**
 * Get full name from first and last name
 * @param firstName - The first name
 * @param lastName - The last name (optional)
 * @returns Full name (e.g., "John Doe")
 */
export function getFullName(firstName: string, lastName: string | null = null): string {
  if (!firstName) return "";
  return lastName ? `${firstName} ${lastName}`.trim() : firstName.trim();
}

/**
 * Get a consistent gradient color based on name hash
 * @param name - The name to hash
 * @returns Tailwind gradient class (e.g., "from-purple-500 to-blue-500")
 */
export function getGradient(name: string): string {
  const gradients = [
    "from-purple-500 to-blue-500",
    "from-green-500 to-blue-500",
    "from-orange-500 to-yellow-500",
    "from-cyan-500 to-green-500",
    "from-pink-500 to-red-500",
    "from-indigo-500 to-purple-500",
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return gradients[Math.abs(hash) % gradients.length];
}

/**
 * Format birthday as "Month Day" (e.g., "Dec 1", "Nov 3")
 * @param birthday - Birthday string in YYYY-MM-DD format
 * @returns Formatted birthday (e.g., "Dec 1")
 */
import { parseISO, format } from 'date-fns';

/**
 * Format birthday as "Month Day" (e.g., "October 26")
 * @param birthday - Birthday string in YYYY-MM-DD format
 * @returns Formatted birthday (e.g., "October 26")
 */
export function formatBirthday(birthday: string | null): string {
  if (!birthday) return "";
  try {
    const date = parseISO(birthday);
    return format(date, 'MMMM d');
  } catch {
    return "";
  }
}
