import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const daysThreshold = parseInt(searchParams.get("days") || "90");

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Call the database function to get decaying relationships
    const { data, error } = await supabase.rpc("get_decaying_relationships", {
      p_user_id: user.id,
      days_threshold: daysThreshold,
    } as any);

    if (error) {
      console.error("Error fetching decaying relationships:", error);
      return NextResponse.json(
        { error: "Failed to fetch decaying relationships" },
        { status: 500 }
      );
    }

    return NextResponse.json({ relationships: data || [] });
  } catch (error) {
    console.error("Error in decay-alerts API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
