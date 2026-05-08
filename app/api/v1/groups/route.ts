import { NextRequest } from "next/server";
import { handleError, ok } from "@/lib/api-response";
import { verifyApiKey } from "@/lib/api-keys";
import { checkRateLimit } from "@/lib/security";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const rawKey = req.headers.get("x-api-key") ?? req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (!rawKey) throw Object.assign(new Error("API key required"), { statusCode: 401 });
    const apiKey = await verifyApiKey(rawKey, "READ");
    if (!apiKey) throw Object.assign(new Error("Invalid API key"), { statusCode: 401 });
    const limit = await checkRateLimit(`api-key:${apiKey.id}`, 600, 60);
    if (!limit.allowed) throw Object.assign(new Error("API rate limit exceeded"), { statusCode: 429 });

    const groups = await db.group.findMany({
      where: { members: { some: { userId: apiKey.userId, removedAt: null } }, isArchived: false },
      select: { id: true, name: true, currency: true, category: true, createdAt: true, updatedAt: true },
      take: 100,
      orderBy: { updatedAt: "desc" },
    });
    return ok(groups);
  } catch (err) {
    return handleError(err);
  }
}
