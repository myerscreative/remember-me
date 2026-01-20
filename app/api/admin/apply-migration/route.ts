import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

export async function POST() {
  try {
    const supabase = await createClient();

    // Check if user is authenticated (you might want to add admin check here)
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
