import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { services } from "@/lib/env";

// GET /api/health — readiness probe for load balancer / uptime monitors
export async function GET() {
  const checks: Record<string, "ok" | "error"> = {};

  // Database
  try {
    await db.$queryRaw`SELECT 1`;
    checks.database = "ok";
  } catch {
    checks.database = "error";
  }

  // Redis (optional)
  if (redis) {
    try {
      await redis.ping();
      checks.redis = "ok";
    } catch {
      checks.redis = "error";
    }
  }
  checks.razorpay = services.razorpay ? "ok" : "error";
  checks.stripe = services.stripe ? "ok" : "error";
  checks.sentry = services.sentry ? "ok" : "error";
  checks.ai = services.ai ? "ok" : "error";

  const requiredChecks = process.env.NODE_ENV === "production"
    ? checks
    : Object.fromEntries(Object.entries(checks).filter(([key]) => key === "database" || key === "redis"));

  const healthy = Object.values(requiredChecks).every((v) => v === "ok");
  return NextResponse.json(
    {
      status: healthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_APP_VERSION ?? "1.0.0",
      checks,
    },
    { status: healthy ? 200 : 503 }
  );
}
