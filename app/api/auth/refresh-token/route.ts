import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { decryptToken, encryptToken, isEncrypted } from "@/lib/utils/encryption";

/**
 * Token Refresh Endpoint
 * Refreshes expired OAuth tokens for Google or Microsoft
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { user, error: authError } = await authenticateRequest(request);
    if (authError) {
      return authError;
    }

    // Get calendar preferences
    const supabase = await createClient();
    const { data: preferences, error: prefError } = await (supabase as any)
      .from("calendar_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (prefError || !preferences) {
      return NextResponse.json(
        { error: "No calendar connection found" },
        { status: 404 }
      );
    }

    const { provider, refresh_token_encrypted } = preferences;

    if (!refresh_token_encrypted) {
      return NextResponse.json(
        { error: "No refresh token available" },
        { status: 400 }
      );
    }

    // Decrypt refresh token (with backward compatibility for unencrypted tokens)
    let refreshToken: string;
    try {
      refreshToken = isEncrypted(refresh_token_encrypted)
        ? decryptToken(refresh_token_encrypted)
        : refresh_token_encrypted;
    } catch (decryptError) {
      console.error("Token decryption error:", decryptError);
      return NextResponse.json(
        { error: "Failed to decrypt refresh token" },
        { status: 500 }
      );
    }

    let tokenResponse;

    if (provider === "google") {
      // Refresh Google token
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        return NextResponse.json(
          { error: "Google OAuth not configured" },
          { status: 500 }
        );
      }

      tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          refresh_token: refreshToken,
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: "refresh_token",
        }),
      });
    } else if (provider === "microsoft") {
      // Refresh Microsoft token
      const clientId = process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID;
      const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        return NextResponse.json(
          { error: "Microsoft OAuth not configured" },
          { status: 500 }
        );
      }

      tokenResponse = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          refresh_token: refreshToken,
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: "refresh_token",
        }),
      });
    } else {
      return NextResponse.json(
        { error: "Unsupported provider" },
        { status: 400 }
      );
    }

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error("Token refresh error:", errorData);
      
      // Update error in database
      await (supabase as any)
        .from("calendar_preferences")
        .update({
          last_sync_error: `Token refresh failed: ${errorData.error || "Unknown error"}`,
        })
        .eq("user_id", user.id);

      return NextResponse.json(
        { error: "Failed to refresh token", details: errorData },
        { status: 401 }
      );
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token: new_refresh_token, expires_in } = tokenData;

    // Calculate new token expiry
    const expiryDate = new Date();
    expiryDate.setSeconds(expiryDate.getSeconds() + expires_in);

    // Encrypt new tokens before storing
    let encryptedAccessToken: string;
    let encryptedRefreshToken: string | undefined;

    try {
      encryptedAccessToken = encryptToken(access_token);
      // Some providers (like Google) may provide a new refresh token
      if (new_refresh_token) {
        encryptedRefreshToken = encryptToken(new_refresh_token);
      }
    } catch (encryptError) {
      console.error("Token encryption error:", encryptError);
      return NextResponse.json(
        { error: "Failed to encrypt tokens" },
        { status: 500 }
      );
    }

    // Update tokens in database
    const updateData: any = {
      access_token_encrypted: encryptedAccessToken,
      token_expiry: expiryDate.toISOString(),
      last_sync_at: new Date().toISOString(),
      last_sync_error: null, // Clear any previous errors
    };

    // Update refresh token if a new one was provided
    if (encryptedRefreshToken) {
      updateData.refresh_token_encrypted = encryptedRefreshToken;
    }

    const { error: updateError } = await (supabase as any)
      .from("calendar_preferences")
      .update(updateData)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Database update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update tokens" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      access_token,
      expires_in,
      expires_at: expiryDate.toISOString(),
    });
  } catch (error: unknown) {
    console.error("Token refresh error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Token refresh failed" },
      { status: 500 }
    );
  }
}


