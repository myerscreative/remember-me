import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Meeting Notifications API
 * Track which meeting notifications have been shown
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { user, error: authError } = await authenticateRequest(request);
    if (authError) {
      return authError;
    }

    const body = await request.json();
    const { event_id, event_title, event_start, event_provider, matched_contacts_count, notification_shown } = body;

    if (!event_id || !event_title || !event_start || !event_provider) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Store notification record
    const supabase = await createClient();
    const { data, error } = await (supabase as any)
      .from("meeting_notifications")
      .upsert({
        user_id: user.id,
        event_id,
        event_title,
        event_start,
        event_provider,
        matched_contacts_count: matched_contacts_count || 0,
        notification_shown: notification_shown || false,
        notification_shown_at: notification_shown ? new Date().toISOString() : null,
      } as any, {
        onConflict: "user_id,event_id",
      })
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to store notification" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("Meeting notification error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process notification" },
      { status: 500 }
    );
  }
}

/**
 * Get notification status for a specific event
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const { user, error: authError } = await authenticateRequest(request);
    if (authError) {
      return authError;
    }

    const searchParams = request.nextUrl.searchParams;
    const eventId = searchParams.get("event_id");

    if (!eventId) {
      return NextResponse.json(
        { error: "Missing event_id parameter" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data, error } = await (supabase as any)
      .from("meeting_notifications")
      .select("*")
      .eq("user_id", user.id)
      .eq("event_id", eventId)
      .single();

    if (error && error.code !== "PGRST116") { // PGRST116 is "not found" error
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to retrieve notification" },
        { status: 500 }
      );
    }

    return NextResponse.json(data || { notification_shown: false });
  } catch (error: unknown) {
    console.error("Get notification error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to retrieve notification" },
      { status: 500 }
    );
  }
}


