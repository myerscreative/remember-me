import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { authenticateRequest } from "@/lib/supabase/auth";

export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await authenticateRequest(request);
    if (authError) {
      return authError;
    }

    const supabase = await createClient();

    const { data: prefs, error: dbError } = await supabase
      .from("calendar_preferences")
      .select("calendar_enabled, provider, last_sync_at")
      .eq("user_id", user.id)
      .single();
    
    // Cast to any to avoid "Property does not exist on type 'never'" until types are regenerated
     
    const safePrefs = prefs as any;

    if (dbError && dbError.code !== 'PGRST116') { // PGRST116 is "Row not found"
      console.error("Error fetching calendar preferences:", dbError);
      return NextResponse.json({ connected: false, error: "Database error" }, { status: 500 });
    }

    if (!safePrefs || !safePrefs.calendar_enabled) {
      return NextResponse.json({ connected: false });
    }

    return NextResponse.json({ 
      connected: true, 
      provider: safePrefs.provider,
      lastSync: safePrefs.last_sync_at 
    });

  } catch (error) {
    console.error("Calendar status API error:", error);
    return NextResponse.json({ connected: false, error: "Internal server error" }, { status: 500 });
  }
}
