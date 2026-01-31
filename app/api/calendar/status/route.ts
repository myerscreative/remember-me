import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ connected: false, error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: prefs, error: dbError } = await supabase
      .from("calendar_preferences")
      .select("calendar_enabled, provider, last_sync_at")
      .eq("user_id", session.user.id)
      .single();
    
    // Cast to any to avoid "Property does not exist on type 'never'" until types are regenerated
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
