import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { contactId, isFavorite } = await request.json();

    if (!contactId) {
      return NextResponse.json(
        { error: "Contact ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Update the contact's favorite status
    const { error: updateError } = await (supabase as any)
      .from("persons")
      .update({ is_favorite: isFavorite })
      .eq("id", contactId)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Error updating favorite status:", updateError);
      return NextResponse.json(
        { error: "Failed to update favorite status" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in toggle-favorite:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
