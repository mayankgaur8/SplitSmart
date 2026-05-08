import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ok, handleError } from "@/lib/api-response";
import { invalidateCache } from "@/lib/redis";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const updateSubSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  monthlyCost: z.number().positive().optional(),
  renewalDate: z.string().datetime().optional(),
  autoRenew: z.boolean().optional(),
  color: z.string().optional(),
});

async function getSubOrThrow(id: string, userId: string) {
  const sub = await db.subscription.findUnique({ where: { id } });
  if (!sub) throw Object.assign(new Error("Subscription not found"), { statusCode: 404 });
  if (sub.userId !== userId) throw Object.assign(new Error("Access denied"), { statusCode: 403 });
  return sub;
}

// GET /api/subscriptions/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const sub = await db.subscription.findUnique({
      where: { id },
      include: {
        groupSubscriptions: { include: { group: { select: { id: true, name: true } } } },
      },
    });
    if (!sub) throw Object.assign(new Error("Not found"), { statusCode: 404 });
    if (sub.userId !== user.id) throw Object.assign(new Error("Access denied"), { statusCode: 403 });
    return ok(sub);
  } catch (err) {
    return handleError(err);
  }
}

// PATCH /api/subscriptions/[id]
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    await getSubOrThrow(id, user.id);

    const body = await req.json();
    const data = updateSubSchema.parse(body);

    const updated = await db.subscription.update({
      where: { id },
      data: {
        ...data,
        ...(data.renewalDate ? { renewalDate: new Date(data.renewalDate) } : {}),
      },
    });

    await invalidateCache(`subs:${user.id}:*`);
    return ok(updated);
  } catch (err) {
    return handleError(err);
  }
}

// DELETE /api/subscriptions/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    await getSubOrThrow(id, user.id);

    await db.subscription.delete({ where: { id } });

    await db.auditLog.create({
      data: { userId: user.id, action: "SUBSCRIPTION_DELETED", resource: "Subscription", resourceId: id },
    });

    await invalidateCache(`subs:${user.id}:*`);
    return ok({ deleted: true });
  } catch (err) {
    return handleError(err);
  }
}
