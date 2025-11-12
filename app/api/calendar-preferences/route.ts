import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Calendar Preferences API
 * Get and update user's calendar preferences
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const { user, error: authError } = await authenticateRequest(request);
    if (authError) {
      return authError;
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from("calendar_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") { // PGRST116 is "not found" error
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to retrieve preferences" },
        { status: 500 }
      );
    }

    // Return defaults if no preferences exist
    if (!data) {
      return NextResponse.json({
        calendar_enabled: false,
        notification_time: 30,
        only_known_contacts: false,
        provider: null,
        last_sync_at: null,
        last_sync_error: null,
      });
    }

    // Don't expose tokens to frontend
    const { access_token_encrypted, refresh_token_encrypted, ...safeData } = data;

    return NextResponse.json(safeData);
  } catch (error: unknown) {
    console.error("Get preferences error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to retrieve preferences" },
      { status: 500 }
    );
  }
}

/**
 * Update calendar preferences
 */
export async function PUT(request: NextRequest) {
  try {
    // Authenticate user
    const { user, error: authError } = await authenticateRequest(request);
    if (authError) {
      return authError;
    }

    const body = await request.json();
    const { calendar_enabled, notification_time, only_known_contacts } = body;

    // Validate notification_time
    if (notification_time !== undefined && (notification_time < 5 || notification_time > 120)) {
      return NextResponse.json(
        { error: "notification_time must be between 5 and 120 minutes" },
        { status: 400 }
      );
    }

    const supabase = createClient();
    
    // Update only the provided fields
    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (calendar_enabled !== undefined) updates.calendar_enabled = calendar_enabled;
    if (notification_time !== undefined) updates.notification_time = notification_time;
    if (only_known_contacts !== undefined) updates.only_known_contacts = only_known_contacts;

    const { data, error } = await supabase
      .from("calendar_preferences")
      .update(updates)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to update preferences" },
        { status: 500 }
      );
    }

    // Don't expose tokens to frontend
    const { access_token_encrypted, refresh_token_encrypted, ...safeData } = data;

    return NextResponse.json(safeData);
  } catch (error: unknown) {
    console.error("Update preferences error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update preferences" },
      { status: 500 }
    );
  }
}

/**
 * Disconnect calendar
 */
export async function DELETE(request: NextRequest) {
  try {
    // Authenticate user
    const { user, error: authError } = await authenticateRequest(request);
    if (authError) {
      return authError;
    }

    const supabase = createClient();
    
    // Delete calendar preferences (will cascade delete notifications)
    const { error } = await supabase
      .from("calendar_preferences")
      .delete()
      .eq("user_id", user.id);

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to disconnect calendar" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Disconnect calendar error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to disconnect calendar" },
      { status: 500 }
    );
  }
}

