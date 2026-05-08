import { db } from "@/lib/db";

export function deterministicBucket(id: string, key: string) {
  const value = `${id}:${key}`.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return value % 100;
}

export async function isFeatureEnabled(key: string, userId: string) {
  const flag = await db.featureFlag.findUnique({ where: { key } }).catch(() => null);
  if (!flag || !flag.enabled) return false;
  return deterministicBucket(userId, key) < flag.rollout;
}
