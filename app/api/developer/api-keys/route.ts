import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { created, handleError, ok } from "@/lib/api-response";
import { db } from "@/lib/db";
import { createApiKeySecret } from "@/lib/api-keys";
import { z } from "zod";

const createApiKeySchema = z.object({
  name: z.string().min(2).max(80),
  scopes: z.array(z.enum(["READ", "WRITE", "BILLING", "ADMIN"])).default(["READ"]),
  expiresAt: z.string().datetime().optional(),
});

export async function GET() {
  try {
    const user = await requireAuth();
    const keys = await db.apiKey.findMany({
      where: { userId: user.id, revokedAt: null },
      select: { id: true, name: true, prefix: true, scopes: true, lastUsedAt: true, expiresAt: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    return ok(keys);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = createApiKeySchema.parse(await req.json());
    const secret = createApiKeySecret();
    const key = await db.apiKey.create({
      data: {
        userId: user.id,
        name: body.name,
        scopes: body.scopes,
        prefix: secret.prefix,
        keyHash: secret.keyHash,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
      },
      select: { id: true, name: true, prefix: true, scopes: true, expiresAt: true, createdAt: true },
    });
    return created({ ...key, apiKey: secret.raw });
  } catch (err) {
    return handleError(err);
  }
}
