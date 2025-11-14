import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { contactId, archived, archivedReason } = body;

    if (!contactId) {
      return NextResponse.json({ error: "Contact ID is required" }, { status: 400 });
    }

    // Use RPC function to bypass PostgREST schema cache
    const { error } = await supabase.rpc('archive_contact', {
      p_contact_id: contactId,
      p_user_id: user.id,
      p_archived: archived,
      p_reason: archivedReason || null,
    } as any);

    if (error) {
      console.error("RPC error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to archive contact" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error archiving contact:", error);
    return NextResponse.json(
      { error: error.message || "Failed to archive contact" },
      { status: 500 }
    );
  }
}

