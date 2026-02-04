import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { rateLimit } from "@/lib/security/rate-limit";

export async function middleware(request: NextRequest) {
  try {
    const { response, user } = await updateSession(request);
    
    // ✅ SECURITY: Rate Limiting
    const ip = request.headers.get("x-forwarded-for")?.split(',')[0] || 
               request.headers.get("x-real-ip") || 
               "unknown";
    const identifier = user ? user.id : ip;


    // 1. Global Rate Limit (Prevent DoS - 60 req/min)
    const globalLimit = await rateLimit(`global_${identifier}`, 60, 60000);
    if (!globalLimit.success) {
      return new NextResponse("Too Many Requests", { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': globalLimit.limit.toString(),
          'X-RateLimit-Remaining': globalLimit.remaining.toString(),
          'Retry-After': globalLimit.reset.toString(),
        }
      });
    }

    // 2. Focused AI Rate Limit (Protect OpenAI Budget - 10 req/min)
    const pathname = request.nextUrl.pathname;
    const isAiRoute = pathname.includes("/api/generate") || 
                      pathname.includes("/api/refresh-ai") ||
                      pathname.includes("/api/parse") ||
                      pathname.includes("/api/transcribe") ||
                      pathname.includes("/api/ai/");

    if (isAiRoute) {
      const aiLimit = await rateLimit(`ai_${identifier}`, 10, 60000);
      if (!aiLimit.success) {
        return NextResponse.json(
          { error: "AI processing limit reached. Please wait a minute." },
          { 
            status: 429,
            headers: { 
              'Retry-After': aiLimit.reset.toString(),
              'X-RateLimit-Limit': aiLimit.limit.toString(),
            }
          }
        );
      }
    }


    // Public routes that don't require authentication
    const publicRoutes = ["/login", "/auth/callback", "/reset-password", "/api/auth"];
    const isPublicRoute = publicRoutes.some((route) =>
      request.nextUrl.pathname.startsWith(route)
    );

    // If accessing a non-public route without authentication, redirect to login
    if (!isPublicRoute && !user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }

    // If authenticated and on login page, redirect to home
    if (user && request.nextUrl.pathname === "/login") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return response;
  } catch (error) {
    console.error("Middleware error:", error);
    // On error, allow public routes to proceed, otherwise redirect to login
    const publicRoutes = ["/login", "/auth/callback", "/reset-password", "/api/auth"];
    const isPublicRoute = publicRoutes.some((route) =>
      request.nextUrl.pathname.startsWith(route)
    );
    
    if (isPublicRoute) {
      return NextResponse.next();
    }
    
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
