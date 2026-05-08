import { NextRequest, NextResponse } from "next/server";

export const CSRF_COOKIE = "__Host-splitsmart-csrf";
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function createCsrfToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function isCsrfProtected(req: NextRequest): boolean {
  if (SAFE_METHODS.has(req.method)) return false;
  const path = req.nextUrl.pathname;
  if (!path.startsWith("/api/")) return false;
  if (path.startsWith("/api/auth/")) return false;
  if (path.startsWith("/api/webhooks/")) return false;
  if (path.startsWith("/api/cron/")) return false;
  if (path.startsWith("/api/v1/")) return false;
  return !req.headers.get("x-api-key");
}

export function validateCsrf(req: NextRequest): boolean {
  if (!isCsrfProtected(req)) return true;
  const origin = req.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).origin === req.nextUrl.origin) return true;
    } catch {
      return false;
    }
  }
  const headerToken = req.headers.get("x-csrf-token");
  const cookieToken = req.cookies.get(CSRF_COOKIE)?.value;
  if (!headerToken || !cookieToken) return false;
  return constantTimeEqual(headerToken, cookieToken);
}

export function attachCsrfCookie(response: NextResponse, token = createCsrfToken()) {
  response.cookies.set(CSRF_COOKIE, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return token;
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let i = 0; i < left.length; i++) {
    result |= left.charCodeAt(i) ^ right.charCodeAt(i);
  }
  return result === 0;
}
