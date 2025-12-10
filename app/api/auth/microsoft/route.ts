import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/supabase/auth";

/**
 * Microsoft OAuth Initiation Route
 * Redirects user to Microsoft's OAuth consent screen
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const { user, error: authError } = await authenticateRequest(request);
    if (authError) {
      return authError;
    }

    // Check for required environment variables
    const clientId = process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_BASE_URL 
      ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/microsoft/callback`
      : `${request.nextUrl.origin}/api/auth/microsoft/callback`;

    if (!clientId) {
      return NextResponse.json(
        { error: "Microsoft OAuth not configured. Please set NEXT_PUBLIC_MICROSOFT_CLIENT_ID." },
        { status: 500 }
      );
    }

    // Build Microsoft OAuth URL
    const authUrl = new URL("https://login.microsoftonline.com/common/oauth2/v2.0/authorize");
    authUrl.searchParams.append("client_id", clientId);
    authUrl.searchParams.append("redirect_uri", redirectUri);
    authUrl.searchParams.append("response_type", "code");
    authUrl.searchParams.append("scope", "Calendars.Read offline_access");
    authUrl.searchParams.append("response_mode", "query");
    authUrl.searchParams.append("state", user.id); // Pass user ID for security

    // Redirect to Microsoft OAuth
    return NextResponse.redirect(authUrl.toString());
  } catch (error: unknown) {
    console.error("Microsoft OAuth initiation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to initiate Microsoft OAuth" },
      { status: 500 }
    );
  }
}




