// Reminder and Follow-up Utilities for ReMember Me
// Smart suggestions for who to reach out to

import { createClient } from "@/lib/supabase/client";
import type { Person } from "@/types/database.types";

export interface ReminderContact extends Person {
  daysSinceContact: number;
  urgency: 'high' | 'medium' | 'low';
  suggestedAction: string;
  reminderReason: string;
}

export interface ReminderStats {
  totalReminders: number;
  highUrgency: number;
  mediumUrgency: number;
  lowUrgency: number;
}

/**
 * Get smart reminder suggestions based on multiple factors:
 * - Time since last interaction
 * - Contact importance
 * - Relationship health
 */
export async function getSmartReminders(): Promise<ReminderContact[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  try {
    const { data: contacts, error } = await supabase
      .from('persons')
      .select('*')
      .eq('user_id', user.id)
      .or('archive_status.is.null,archive_status.eq.false')
      .order('last_interaction_date', { ascending: true, nullsFirst: false });

    if (error) {
      console.error('Error fetching contacts for reminders:', error);
      return [];
    }

    const contactsList = contacts || [];
    const now = Date.now();
    const reminders: ReminderContact[] = [];

    for (const contact of contactsList) {
      // Skip if never interacted
      if (!contact.last_interaction_date) {
        continue;
      }

      const lastInteraction = new Date(contact.last_interaction_date).getTime();
      const daysSince = Math.floor((now - lastInteraction) / (1000 * 60 * 60 * 24));

      // Determine thresholds based on importance
      let threshold = 30; // Default: 30 days
      if (contact.contact_importance === 'high') {
        threshold = 14; // High priority: 2 weeks
      } else if (contact.contact_importance === 'medium') {
        threshold = 21; // Medium priority: 3 weeks
      }

      // Only create reminder if past threshold
      if (daysSince >= threshold) {
        const urgency = determineUrgency(daysSince, contact.contact_importance);
        const suggestedAction = getSuggestedAction(contact, daysSince);
        const reminderReason = getReminderReason(contact, daysSince);

        reminders.push({
          ...contact,
          daysSinceContact: daysSince,
          urgency,
          suggestedAction,
          reminderReason,
        });
      }
    }

    // Sort by urgency then days since contact
    reminders.sort((a, b) => {
      const urgencyOrder = { high: 0, medium: 1, low: 2 };
      const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      if (urgencyDiff !== 0) return urgencyDiff;
      return b.daysSinceContact - a.daysSinceContact;
    });

    return reminders;
  } catch (error) {
    console.error('Error generating smart reminders:', error);
    return [];
  }
}

/**
 * Determine urgency level based on days and importance
 */
function determineUrgency(
  daysSince: number,
  importance: 'high' | 'medium' | 'low' | null
): 'high' | 'medium' | 'low' {
  // High priority contacts
  if (importance === 'high') {
    if (daysSince >= 30) return 'high';
    if (daysSince >= 14) return 'medium';
    return 'low';
  }

  // Medium priority contacts
  if (importance === 'medium') {
    if (daysSince >= 60) return 'high';
    if (daysSince >= 30) return 'medium';
    return 'low';
  }

  // Low priority or no priority
  if (daysSince >= 90) return 'high';
  if (daysSince >= 60) return 'medium';
  return 'low';
}

/**
 * Get suggested action based on contact context
 */
function getSuggestedAction(contact: Person, daysSince: number): string {
  const actions = [
    'Send a quick message',
    'Schedule a coffee chat',
    'Share an interesting article',
    'Check in on their recent project',
    'Congratulate them on recent news',
    'Invite to an event',
    'Schedule a video call',
    'Send a thoughtful email',
  ];

  // High priority gets more formal suggestions
  if (contact.contact_importance === 'high') {
    if (daysSince >= 60) {
      return 'Schedule a meeting or call';
    }
    return 'Send a personalized message';
  }

  // Random suggestion for variety
  return actions[Math.floor(Math.random() * actions.length)];
}

/**
 * Get reason for reminder
 */
function getReminderReason(contact: Person, daysSince: number): string {
  const name = contact.first_name || contact.name;

  if (contact.contact_importance === 'high') {
    if (daysSince >= 60) {
      return `It's been ${daysSince} days since you last connected with ${name}. High priority contacts need regular attention.`;
    }
    return `${name} is a high priority contact. Consider reaching out soon.`;
  }

  if (daysSince >= 90) {
    return `It's been over 3 months since your last interaction with ${name}.`;
  }

  if (daysSince >= 60) {
    return `It's been about 2 months since you connected with ${name}.`;
  }

  return `Time to reconnect with ${name}.`;
}

/**
 * Get reminder statistics
 */
export async function getReminderStats(): Promise<ReminderStats> {
  const reminders = await getSmartReminders();

  return {
    totalReminders: reminders.length,
    highUrgency: reminders.filter(r => r.urgency === 'high').length,
    mediumUrgency: reminders.filter(r => r.urgency === 'medium').length,
    lowUrgency: reminders.filter(r => r.urgency === 'low').length,
  };
}

/**
 * Get reminders by urgency
 */
export async function getRemindersByUrgency(
  urgency: 'high' | 'medium' | 'low'
): Promise<ReminderContact[]> {
  const allReminders = await getSmartReminders();
  return allReminders.filter(r => r.urgency === urgency);
}

/**
 * Get reminders for high priority contacts only
 */
export async function getHighPriorityReminders(): Promise<ReminderContact[]> {
  const allReminders = await getSmartReminders();
  return allReminders.filter(r => r.contact_importance === 'high');
}

/**
 * Mark contact as reached out (update last_interaction_date)
 */
export async function markAsReachedOut(personId: string): Promise<boolean> {
  const supabase = createClient();

  try {
    const { error } = await supabase
      .from('persons')
      .update({
        last_interaction_date: new Date().toISOString().split('T')[0],
        interaction_count: supabase.raw('interaction_count + 1'),
      })
      .eq('id', personId);

    if (error) {
      console.error('Error marking as reached out:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating interaction:', error);
    return false;
  }
}

/**
 * Snooze reminder for a contact (update last_interaction_date without incrementing count)
 */
export async function snoozeReminder(personId: string, days: number = 7): Promise<boolean> {
  const supabase = createClient();

  try {
    const newDate = new Date();
    newDate.setDate(newDate.getDate() - (30 - days)); // Adjust so reminder appears in X days

    const { error } = await supabase
      .from('persons')
      .update({
        last_interaction_date: newDate.toISOString().split('T')[0],
      })
      .eq('id', personId);

    if (error) {
      console.error('Error snoozing reminder:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error snoozing reminder:', error);
    return false;
  }
}

/**
 * Format urgency badge color
 */
export function getUrgencyColor(urgency: 'high' | 'medium' | 'low'): {
  bg: string;
  text: string;
  border: string;
} {
  switch (urgency) {
    case 'high':
      return {
        bg: 'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-700 dark:text-red-300',
        border: 'border-red-200 dark:border-red-800',
      };
    case 'medium':
      return {
        bg: 'bg-yellow-100 dark:bg-yellow-900/30',
        text: 'text-yellow-700 dark:text-yellow-300',
        border: 'border-yellow-200 dark:border-yellow-800',
      };
    case 'low':
      return {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'text-blue-700 dark:text-blue-300',
        border: 'border-blue-200 dark:border-blue-800',
      };
  }
}

/**
 * Format days into friendly string
 */
export function formatDaysAgo(days: number): string {
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

/**
 * Get next recommended check-in date based on importance
 */
export function getNextCheckInDate(
  lastInteractionDate: string | null,
  importance: 'high' | 'medium' | 'low' | null
): Date {
  const lastDate = lastInteractionDate ? new Date(lastInteractionDate) : new Date();
  const nextDate = new Date(lastDate);

  // Add days based on importance
  if (importance === 'high') {
    nextDate.setDate(nextDate.getDate() + 14); // 2 weeks
  } else if (importance === 'medium') {
    nextDate.setDate(nextDate.getDate() + 21); // 3 weeks
  } else {
    nextDate.setDate(nextDate.getDate() + 30); // 4 weeks
  }

  return nextDate;
}
