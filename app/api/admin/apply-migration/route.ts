import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

export async function POST() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Admin check: Only allow specific admin emails to apply migrations
    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || [];
    if (!user.email || !adminEmails.includes(user.email.toLowerCase())) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    // Read the migration file
    const migrationPath = join(
      process.cwd(),
      "supabase",
      "migrations",
      "20260120000000_fix_decaying_relationships.sql"
    );
    const migrationSQL = readFileSync(migrationPath, "utf-8");

    // Execute the migration
    const { error } = await supabase.rpc("exec_sql", {
      sql: migrationSQL,
    } as any);

    if (error) {
      console.error("Migration error:", error);
      return NextResponse.json(
        { error: "Failed to apply migration", details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Migration applied successfully",
    });
  } catch (error) {
    console.error("Error applying migration:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
