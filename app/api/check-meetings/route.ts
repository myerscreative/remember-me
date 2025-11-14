import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { fetchUpcomingEvents } from "@/lib/calendar/calendarIntegration";
import { getMeetingsRequiringNotification } from "@/lib/calendar/meetingMatcher";

/**
 * Check Meetings API Endpoint
 * Called periodically to check for upcoming meetings requiring notifications
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const { user, error: authError } = await authenticateRequest(request);
    if (authError) {
      return authError;
    }

    // Get calendar preferences
    const supabase = await createClient();
    const { data: preferences, error: prefError } = await (supabase as any)
      .from("calendar_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (prefError || !preferences) {
      return NextResponse.json({
        enabled: false,
        message: "No calendar connection found",
      });
    }

    if (!preferences.calendar_enabled) {
      return NextResponse.json({
        enabled: false,
        message: "Calendar sync is disabled",
      });
    }

    const { provider, access_token_encrypted, notification_time } = preferences;

    // TODO: Decrypt access token
    const accessToken = access_token_encrypted;

    // Fetch upcoming events
    let events;
    try {
      events = await fetchUpcomingEvents(provider, accessToken, 1); // Next 1 day
    } catch (error: unknown) {
      console.error("Failed to fetch events:", error);
      
      // Update error in database
      await (supabase as any)
        .from("calendar_preferences")
        .update({
          last_sync_error: error instanceof Error ? error.message : "Failed to fetch events",
        } as any)
        .eq("user_id", user.id);

      return NextResponse.json(
        { error: "Failed to fetch calendar events" },
        { status: 500 }
      );
    }

    // Get meetings requiring notification
    const meetingsToNotify = await getMeetingsRequiringNotification(
      events,
      notification_time || 30
    );

    // Filter out meetings that have already been notified
    const newMeetings = [];
    for (const meeting of meetingsToNotify) {
      const { data: existing } = await (supabase as any)
        .from("meeting_notifications")
        .select("*")
        .eq("user_id", user.id)
        .eq("event_id", meeting.event.id)
        .eq("notification_shown", true)
        .single();

      if (!existing) {
        newMeetings.push(meeting);
      }
    }

    // Update sync status
    await (supabase as any)
      .from("calendar_preferences")
      .update({
        last_sync_at: new Date().toISOString(),
        last_sync_error: null,
        sync_count: (preferences.sync_count || 0) + 1,
      } as any)
      .eq("user_id", user.id);

    return NextResponse.json({
      enabled: true,
      totalEvents: events.length,
      meetingsRequiringNotification: meetingsToNotify.length,
      newMeetings: newMeetings.length,
      meetings: newMeetings.map(m => ({
        id: m.event.id,
        title: m.event.title,
        start: m.event.start,
        minutesUntil: m.minutesUntilMeeting,
        knownContacts: m.persons.length,
        unknownAttendees: m.unmatchedAttendees.length,
      })),
    });
  } catch (error: unknown) {
    console.error("Check meetings error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to check meetings" },
      { status: 500 }
    );
  }
}


