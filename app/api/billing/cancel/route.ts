import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ok, handleError } from "@/lib/api-response";
import { cancelPlanSchema } from "@/lib/validations";

// POST /api/billing/cancel — cancel subscription at period end
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { reason } = cancelPlanSchema.parse(body);

    const current = await db.user.findUnique({
      where: { id: user.id },
      select: { planExpiresAt: true },
    });
    const effectiveAt = current?.planExpiresAt ?? new Date();

    await db.user.update({
      where: { id: user.id },
      data: { planStatus: "CANCELLED", cancelEffectiveAt: effectiveAt },
    });

    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "PLAN_CANCELLED",
        resource: "User",
        resourceId: user.id,
        metadata: { reason },
      },
    });

    return ok({ cancelled: true, message: "Plan cancelled. Access continues until period end." });
  } catch (err) {
    return handleError(err);
  }
}
