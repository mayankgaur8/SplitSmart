import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextAuthRequest } from "next-auth";

// Routes that require authentication
const PROTECTED_ROUTES = [
  "/dashboard",
  "/groups",
  "/expenses",
  "/subscriptions",
  "/settlements",
  "/gamification",
  "/analytics",
  "/admin",
  "/settings",
];

// Routes that require SUPER_ADMIN or TEAM_ADMIN
const ADMIN_ROUTES = ["/admin"];

// Public API routes (no auth needed)
const PUBLIC_API_ROUTES = [
  "/api/auth",
  "/api/health",
  "/api/webhooks",
];

export default auth(function middleware(req: NextAuthRequest) {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // ── Security headers (all responses) ───────────────────────────────────────
  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-DNS-Prefetch-Control", "on");
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://checkout.razorpay.com https://js.stripe.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' blob: data: https:",
      "frame-src https://api.razorpay.com https://js.stripe.com",
      "connect-src 'self' https://api.razorpay.com https://api.stripe.com wss:",
    ].join("; ")
  );

  // ── Public API routes — skip auth ───────────────────────────────────────────
  if (PUBLIC_API_ROUTES.some((r) => pathname.startsWith(r))) {
    return response;
  }

  // ── API routes — require JWT session ────────────────────────────────────────
  if (pathname.startsWith("/api/")) {
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return response;
  }

  // ── Protected pages — redirect to login ─────────────────────────────────────
  const isProtected = PROTECTED_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r + "/")
  );

  if (isProtected) {
    if (!session?.user?.id) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Admin route — require SUPER_ADMIN or TEAM_ADMIN role
    const isAdminRoute = ADMIN_ROUTES.some(
      (r) => pathname === r || pathname.startsWith(r + "/")
    );
    if (isAdminRoute) {
      const role = (session.user as { role?: string }).role;
      if (role !== "SUPER_ADMIN" && role !== "TEAM_ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }
  }

  // ── Redirect logged-in users away from auth pages ───────────────────────────
  if (pathname === "/login" || pathname === "/signup") {
    if (session?.user?.id) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return response;
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|sw.js).*)",
  ],
};
