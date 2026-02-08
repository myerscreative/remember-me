import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";

/**
 * Google OAuth Initiation Route
 * Redirects user to Google's OAuth consent screen
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
       return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }
    const userId = session.user.id;

    // Check for required environment variables
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    
    // Use the origin from the request to build the redirect URI
    const origin = request.nextUrl.origin;
    const redirectUri = `${origin}/api/auth/google/callback`;

    if (!clientId) {
      return NextResponse.json(
        { error: "Google OAuth not configured. Please set GOOGLE_CLIENT_ID in your environment variables." },
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
    authUrl.searchParams.append("state", userId); // Pass user ID for security

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




