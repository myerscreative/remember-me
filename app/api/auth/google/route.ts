import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/supabase/auth";

/**
 * Google OAuth Initiation Route
 * Redirects user to Google's OAuth consent screen
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const { user, error: authError } = await authenticateRequest(request);
    if (authError) {
      return authError;
    }

    // Check for required environment variables
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_BASE_URL 
      ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/google/callback`
      : `${request.nextUrl.origin}/api/auth/google/callback`;

    if (!clientId) {
      return NextResponse.json(
        { error: "Google OAuth not configured. Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID." },
        { status: 500 }
      );
    }

    // Build Google OAuth URL
    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.append("client_id", clientId);
    authUrl.searchParams.append("redirect_uri", redirectUri);
    authUrl.searchParams.append("response_type", "code");
    authUrl.searchParams.append("scope", "https://www.googleapis.com/auth/calendar.readonly");
    authUrl.searchParams.append("access_type", "offline"); // Get refresh token
    authUrl.searchParams.append("prompt", "consent"); // Force consent to get refresh token
    authUrl.searchParams.append("state", user.id); // Pass user ID for security

    // Redirect to Google OAuth
    return NextResponse.redirect(authUrl.toString());
  } catch (error: unknown) {
    console.error("Google OAuth initiation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to initiate Google OAuth" },
      { status: 500 }
    );
  }
}




