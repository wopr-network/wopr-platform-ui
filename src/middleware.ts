import { type NextRequest, NextResponse } from "next/server";

const publicPaths = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
  "/onboard",
  "/onboarding",
];

const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Validate that a state-changing request originates from this application.
 * Checks the Origin header (preferred) with Referer as fallback.
 * Returns true if the request is safe, false if it should be blocked.
 */
export function validateCsrfOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const host = request.headers.get("host");

  if (!host) return false;

  // Build the set of allowed origins from the request host
  const allowedOrigins = new Set([`https://${host}`, `http://${host}`]);

  // Check Origin header first (most reliable)
  if (origin) {
    return allowedOrigins.has(origin);
  }

  // Fall back to Referer header
  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      return allowedOrigins.has(refererOrigin);
    } catch {
      return false;
    }
  }

  // No Origin or Referer on a mutation request is suspicious — block it.
  // Legitimate browser form submissions and fetch() calls include Origin.
  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // CSRF protection: validate Origin/Referer on state-changing API requests
  if (pathname.startsWith("/api") && MUTATION_METHODS.has(request.method)) {
    if (!validateCsrfOrigin(request)) {
      return NextResponse.json({ error: "CSRF validation failed" }, { status: 403 });
    }
  }

  // Allow public paths
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow static files and API routes
  if (pathname.startsWith("/_next") || pathname.startsWith("/api") || pathname.includes(".")) {
    return NextResponse.next();
  }

  // Check for session cookie (Better Auth uses "better-auth.session_token" by default)
  const sessionToken =
    request.cookies.get("better-auth.session_token") ??
    request.cookies.get("__Secure-better-auth.session_token");

  if (!sessionToken || !sessionToken.value.trim()) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
