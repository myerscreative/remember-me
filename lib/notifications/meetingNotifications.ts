/**
 * Meeting Notifications System
 * Handles browser notifications for upcoming meetings
 */

import { MeetingPrep } from "@/types/calendar";

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) {
    console.warn("Browser does not support notifications");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
}

/**
 * Check if notifications are currently enabled
 */
export function areNotificationsEnabled(): boolean {
  return "Notification" in window && Notification.permission === "granted";
}

/**
 * Show a meeting prep notification
 */
export function showMeetingPrepNotification(meetingPrep: MeetingPrep): void {
  if (!areNotificationsEnabled()) {
    console.warn("Notifications not enabled");
    return;
  }

  const { event, persons, minutesUntilMeeting } = meetingPrep;

  // Build notification body
  let body = `Starting in ${minutesUntilMeeting} minutes`;
  if (persons.length > 0) {
    body += `\nWith: ${persons.map(p => `${p.first_name} ${p.last_name || ""}`).join(", ")}`;
  }

  // Create notification
  const notification = new Notification("Meeting Prep Ready", {
    body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: event.id, // Prevent duplicate notifications
    requireInteraction: false,
    silent: false,
    data: {
      eventId: event.id,
      url: "/meeting-prep",
    },
  });

  // Handle notification click
  notification.onclick = () => {
    window.focus();
    window.location.href = "/meeting-prep";
    notification.close();
  };

  // Auto-close after 10 seconds
  setTimeout(() => {
    notification.close();
  }, 10000);
}

/**
 * Show multiple meeting notifications
 */
export function showMultipleMeetingNotifications(meetingPreps: MeetingPrep[]): void {
  if (!areNotificationsEnabled()) {
    console.warn("Notifications not enabled");
    return;
  }

  // Show up to 3 notifications at once to avoid spam
  const meetingsToNotify = meetingPreps.slice(0, 3);

  meetingsToNotify.forEach(prep => {
    showMeetingPrepNotification(prep);
  });

  // If more than 3, show a summary notification
  if (meetingPreps.length > 3) {
    const notification = new Notification("Multiple Meetings Coming Up", {
      body: `You have ${meetingPreps.length} meetings in the next 30 minutes`,
      icon: "/icon-192.png",
      tag: "multiple-meetings",
      requireInteraction: false,
      data: {
        url: "/meeting-prep",
      },
    });

    notification.onclick = () => {
      window.focus();
      window.location.href = "/meeting-prep";
      notification.close();
    };
  }
}

/**
 * Mark a notification as shown in the database
 */
export async function markNotificationShown(eventId: string, eventTitle: string, eventStart: Date, provider: string, contactsCount: number): Promise<void> {
  try {
    await fetch("/api/meeting-notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event_id: eventId,
        event_title: eventTitle,
        event_start: eventStart.toISOString(),
        event_provider: provider,
        matched_contacts_count: contactsCount,
        notification_shown: true,
      }),
    });
  } catch (error) {
    console.error("Failed to mark notification as shown:", error);
  }
}

/**
 * Check if a notification has already been shown for an event
 */
export async function wasNotificationShown(eventId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/meeting-notifications/${eventId}`);
    if (response.ok) {
      const data = await response.json();
      return data.notification_shown === true;
    }
    return false;
  } catch (error) {
    console.error("Failed to check notification status:", error);
    return false;
  }
}

/**
 * Get notification preferences from user settings
 */
export interface NotificationPreferences {
  enabled: boolean;
  minutesBefore: number;
  onlyKnownContacts: boolean;
}

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  try {
    const response = await fetch("/api/calendar-preferences");
    if (response.ok) {
      const data = await response.json();
      return {
        enabled: data.calendar_enabled || false,
        minutesBefore: data.notification_time || 30,
        onlyKnownContacts: data.only_known_contacts || false,
      };
    }
  } catch (error) {
    console.error("Failed to get notification preferences:", error);
  }

  // Return defaults
  return {
    enabled: false,
    minutesBefore: 30,
    onlyKnownContacts: false,
  };
}




