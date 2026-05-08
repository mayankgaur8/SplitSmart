import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { created, handleError, ok } from "@/lib/api-response";
import { db } from "@/lib/db";
import { hashToken } from "@/lib/security";
import crypto from "crypto";
import { z } from "zod";

const webhookSchema = z.object({
  url: z.string().url(),
  events: z.array(z.string().min(3)).min(1).max(25),
});

export async function GET() {
  try {
    const user = await requireAuth();
    const webhooks = await db.customerWebhook.findMany({
      where: { userId: user.id },
      select: { id: true, url: true, events: true, isActive: true, failureCount: true, lastSuccessAt: true, lastFailureAt: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    return ok(webhooks);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = webhookSchema.parse(await req.json());
    const secret = `whsec_${crypto.randomBytes(32).toString("base64url")}`;
    const webhook = await db.customerWebhook.create({
      data: {
        userId: user.id,
        url: body.url,
        events: body.events,
        secretHash: hashToken(secret),
      },
      select: { id: true, url: true, events: true, isActive: true, createdAt: true },
    });
    return created({ ...webhook, secret });
  } catch (err) {
    return handleError(err);
  }
}
