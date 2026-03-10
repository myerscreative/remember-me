import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { encryptToken } from "@/lib/utils/encryption";
import { authenticateRequest } from "@/lib/supabase/auth";
import type { Database } from "@/types/database.types";

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

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
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    
    // Use the same canonical redirect URI as used in the initiation route
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
    const redirectUri = `${baseUrl}/api/auth/google/callback`;

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

    // Resolve the Supabase user id (preferred: active session, fallback: validated state)
    const { user } = await authenticateRequest(request);
    const userId = user?.id || (state && isUuid(state) ? state : null);
    if (!userId) {
      return NextResponse.redirect(
        `${request.nextUrl.origin}/meeting-prep?error=missing_user_id`
      );
    }

    // Encrypt tokens before storing in database
    let encryptedAccessToken: string;
    let encryptedRefreshToken: string | null = null;

    try {
      encryptedAccessToken = encryptToken(access_token);
      if (refresh_token) {
        encryptedRefreshToken = encryptToken(refresh_token);
      }
    } catch (encryptError) {
      console.error("Token encryption error:", encryptError);
      return NextResponse.redirect(
        `${request.nextUrl.origin}/meeting-prep?error=encryption_failed`
      );
    }

    let dbError: unknown = null;

    // Primary path: use authenticated user session + RLS (no service role needed)
    if (user?.id) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        return NextResponse.redirect(
          `${request.nextUrl.origin}/meeting-prep?error=config_missing`
        );
      }

      const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {
            // No-op in callback route
          },
        },
      });

      const { data: existing } = await supabase
        .from("calendar_preferences")
        .select("refresh_token_encrypted")
        .eq("user_id", userId)
        .maybeSingle<{ refresh_token_encrypted: string | null }>();

      const { error } = await supabase
        .from("calendar_preferences")
        .upsert({
          user_id: userId,
          provider: "google",
          calendar_enabled: true,
          access_token_encrypted: encryptedAccessToken,
          refresh_token_encrypted: encryptedRefreshToken ?? existing?.refresh_token_encrypted ?? null,
          token_expiry: expiryDate.toISOString(),
          last_sync_at: new Date().toISOString(),
          notification_time: 30,
        } as any, {
          onConflict: "user_id",
        });
      dbError = error;
    } else {
      // Fallback path if callback arrives without a session cookie
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!supabaseUrl || !serviceRoleKey) {
        return NextResponse.redirect(
          `${request.nextUrl.origin}/meeting-prep?error=config_missing`
        );
      }

      const supabase = createClient<Database>(supabaseUrl, serviceRoleKey);

      const { data: existing } = await supabase
        .from("calendar_preferences")
        .select("refresh_token_encrypted")
        .eq("user_id", userId)
        .maybeSingle<{ refresh_token_encrypted: string | null }>();

      const { error } = await supabase
        .from("calendar_preferences")
        .upsert({
          user_id: userId,
          provider: "google",
          calendar_enabled: true,
          access_token_encrypted: encryptedAccessToken,
          refresh_token_encrypted: encryptedRefreshToken ?? existing?.refresh_token_encrypted ?? null,
          token_expiry: expiryDate.toISOString(),
          last_sync_at: new Date().toISOString(),
          notification_time: 30,
        } as any, {
          onConflict: "user_id",
        });
      dbError = error;
    }

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




