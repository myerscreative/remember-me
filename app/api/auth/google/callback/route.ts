import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { encryptToken } from "@/lib/utils/encryption";

/**
 * Google OAuth Callback Route
 * Handles OAuth callback from Google and stores tokens
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state"); // user_id
    const error = searchParams.get("error");

    // Handle OAuth errors
    if (error) {
      console.error("Google OAuth error:", error);
      return NextResponse.redirect(
        `${request.nextUrl.origin}/meeting-prep?error=oauth_denied`
      );
    }

    if (!code) {
      return NextResponse.redirect(
        `${request.nextUrl.origin}/meeting-prep?error=missing_code`
      );
    }

    // Exchange authorization code for access token
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.NEXT_PUBLIC_BASE_URL 
      ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/google/callback`
      : `${request.nextUrl.origin}/api/auth/google/callback`;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        `${request.nextUrl.origin}/meeting-prep?error=config_missing`
      );
    }

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error("Token exchange error:", errorData);
      return NextResponse.redirect(
        `${request.nextUrl.origin}/meeting-prep?error=token_exchange_failed`
      );
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokenData;

    // Calculate token expiry
    const expiryDate = new Date();
    expiryDate.setSeconds(expiryDate.getSeconds() + expires_in);

    // Store tokens in database
    const supabase = await createClient();
    
    // Get user from state or current session
    const userId = state;
    if (!userId) {
      return NextResponse.redirect(
        `${request.nextUrl.origin}/meeting-prep?error=missing_user_id`
      );
    }

    // Encrypt tokens before storing in database
    let encryptedAccessToken: string;
    let encryptedRefreshToken: string;

    try {
      encryptedAccessToken = encryptToken(access_token);
      encryptedRefreshToken = encryptToken(refresh_token);
    } catch (encryptError) {
      console.error("Token encryption error:", encryptError);
      return NextResponse.redirect(
        `${request.nextUrl.origin}/meeting-prep?error=encryption_failed`
      );
    }

    const { error: dbError } = await (supabase as any)
      .from("calendar_preferences")
      .upsert({
        user_id: userId,
        provider: "google",
        calendar_enabled: true,
        access_token_encrypted: encryptedAccessToken,
        refresh_token_encrypted: encryptedRefreshToken,
        token_expiry: expiryDate.toISOString(),
        last_sync_at: new Date().toISOString(),
        notification_time: 30, // Default to 30 minutes
      } as any, {
        onConflict: "user_id",
      });

    if (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.redirect(
        `${request.nextUrl.origin}/meeting-prep?error=db_error`
      );
    }

    // Redirect back to meeting prep page with success
    return NextResponse.redirect(
      `${request.nextUrl.origin}/meeting-prep?success=google_connected`
    );
  } catch (error: unknown) {
    console.error("Google OAuth callback error:", error);
    return NextResponse.redirect(
      `${request.nextUrl.origin}/meeting-prep?error=unexpected`
    );
  }
}


