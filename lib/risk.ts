import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getClientIp, hashToken } from "@/lib/security";

const HIGH_RISK_EMAIL_DOMAINS = new Set([
  "mailinator.com",
  "10minutemail.com",
  "guerrillamail.com",
  "tempmail.com",
  "yopmail.com",
  "sharklasers.com",
]);

const BLOCKED_IP_PREFIXES = (process.env.BLOCKED_IP_PREFIXES ?? "")
  .split(",")
  .map((v) => v.trim())
  .filter(Boolean);

export function isDisposableEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  return Boolean(domain && HIGH_RISK_EMAIL_DOMAINS.has(domain));
}

export function isBlockedIp(ip: string): boolean {
  return BLOCKED_IP_PREFIXES.some((prefix) => ip.startsWith(prefix));
}

export function deviceFingerprint(req: NextRequest): string {
  const source = [
    req.headers.get("user-agent") ?? "",
    req.headers.get("accept-language") ?? "",
    req.headers.get("sec-ch-ua-platform") ?? "",
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "",
  ].join("|");
  return hashToken(source);
}

export async function assessSignupRisk(req: NextRequest, email: string) {
  const ip = getClientIp(req);
  let score = 0;
  const reasons: string[] = [];
  if (isDisposableEmail(email)) {
    score += 80;
    reasons.push("disposable_email");
  }
  if (isBlockedIp(ip)) {
    score += 100;
    reasons.push("blocked_ip_reputation");
  }
  const recentFailures = await db.riskEvent.count({
    where: { ipAddress: ip, createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } },
  }).catch(() => 0);
  if (recentFailures > 5) {
    score += 30;
    reasons.push("recent_risk_events");
  }
  return { score, level: score >= 100 ? "CRITICAL" : score >= 70 ? "HIGH" : score >= 30 ? "MEDIUM" : "LOW", reasons, ip };
}

export async function recordRiskEvent(params: {
  userId?: string | null;
  type: "SUSPICIOUS_LOGIN" | "IMPOSSIBLE_TRAVEL" | "SESSION_ANOMALY" | "BRUTE_FORCE" | "IP_REPUTATION_BLOCK" | "PAYMENT_ABUSE" | "REFUND_ABUSE" | "DISPOSABLE_EMAIL" | "API_ABUSE";
  level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  score: number;
  reason: string;
  ipAddress?: string;
  fingerprintHash?: string;
  metadata?: Record<string, unknown>;
}) {
  await db.riskEvent.create({
    data: {
      userId: params.userId ?? undefined,
      type: params.type,
      level: params.level,
      score: params.score,
      reason: params.reason,
      ipAddress: params.ipAddress,
      fingerprintHash: params.fingerprintHash,
      metadata: params.metadata as never,
    },
  }).catch(() => {});
}

export async function upsertDevice(userId: string, req: NextRequest) {
  const fingerprintHash = deviceFingerprint(req);
  return db.userDevice.upsert({
    where: { userId_fingerprintHash: { userId, fingerprintHash } },
    create: {
      userId,
      fingerprintHash,
      userAgent: req.headers.get("user-agent") ?? undefined,
      ipAddress: getClientIp(req),
    },
    update: {
      lastSeenAt: new Date(),
      userAgent: req.headers.get("user-agent") ?? undefined,
      ipAddress: getClientIp(req),
    },
  });
}
