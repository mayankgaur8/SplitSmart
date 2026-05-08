import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";

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

  const healthy = Object.values(checks).every((v) => v === "ok");
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
