import { NextRequest } from "next/server";
import crypto from "crypto";
import { redis } from "@/lib/redis";

export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; resetSeconds: number }> {
  if (!redis) return { allowed: true, remaining: limit - 1, resetSeconds: windowSeconds };

  const redisKey = `rate:${key}`;
  const count = await redis.incr(redisKey);
  if (count === 1) await redis.expire(redisKey, windowSeconds);
  const ttl = await redis.ttl(redisKey);

  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
    resetSeconds: ttl > 0 ? ttl : windowSeconds,
  };
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function hasPromptInjectionRisk(input: string): boolean {
  return [
    /ignore (all )?(previous|prior|above) instructions/i,
    /reveal (the )?(system|developer|hidden) prompt/i,
    /print (the )?(system|developer|hidden) prompt/i,
    /you are now/i,
  ].some((pattern) => pattern.test(input));
}
