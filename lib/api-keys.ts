import crypto from "crypto";
import { db } from "@/lib/db";
import { hashToken } from "@/lib/security";

export function createApiKeySecret() {
  const raw = `sk_live_${crypto.randomBytes(32).toString("base64url")}`;
  return {
    raw,
    prefix: raw.slice(0, 16),
    keyHash: hashToken(raw),
  };
}

export async function verifyApiKey(rawKey: string, requiredScope: "READ" | "WRITE" | "BILLING" | "ADMIN" = "READ") {
  const keyHash = hashToken(rawKey);
  const key = await db.apiKey.findUnique({ where: { keyHash }, include: { user: true } });
  if (!key || key.revokedAt || (key.expiresAt && key.expiresAt < new Date())) return null;
  if (!key.scopes.includes(requiredScope) && !key.scopes.includes("ADMIN")) return null;
  await db.apiKey.update({ where: { id: key.id }, data: { lastUsedAt: new Date() } }).catch(() => {});
  return key;
}
