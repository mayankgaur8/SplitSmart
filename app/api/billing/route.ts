import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ok, handleError } from "@/lib/api-response";
import { PLAN_PRICING } from "@/lib/services/plan";

// GET /api/billing — current plan + invoice history
export async function GET(_req: NextRequest) {
  try {
    const user = await requireAuth();

    const [dbUser, invoices] = await Promise.all([
      db.user.findUnique({
        where: { id: user.id },
        select: {
          plan: true,
          planStatus: true,
          planStartedAt: true,
          planExpiresAt: true,
          stripeCustomerId: true,
        },
      }),
      db.invoice.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 12,
      }),
    ]);

    if (!dbUser) throw new Error("User not found");

    return ok({
      plan: dbUser.plan,
      planStatus: dbUser.planStatus,
      planStartedAt: dbUser.planStartedAt,
      planExpiresAt: dbUser.planExpiresAt,
      pricing: PLAN_PRICING,
      invoices,
    });
  } catch (err) {
    return handleError(err);
  }
}
