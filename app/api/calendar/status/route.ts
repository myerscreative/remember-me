import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ connected: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data: prefs, error: dbError } = await supabase
      .from("calendar_preferences")
      .select("calendar_enabled, provider, last_sync_at")
      .eq("user_id", user.id)
      .single();

    if (dbError && dbError.code !== 'PGRST116') { // PGRST116 is "Row not found"
      console.error("Error fetching calendar preferences:", dbError);
      return NextResponse.json({ connected: false, error: "Database error" }, { status: 500 });
    }

    if (!prefs || !prefs.calendar_enabled) {
      return NextResponse.json({ connected: false });
    }

    return NextResponse.json({ 
      connected: true, 
      provider: prefs.provider,
      lastSync: prefs.last_sync_at 
    });

  } catch (error) {
    console.error("Calendar status API error:", error);
    return NextResponse.json({ connected: false, error: "Internal server error" }, { status: 500 });
  }
}
