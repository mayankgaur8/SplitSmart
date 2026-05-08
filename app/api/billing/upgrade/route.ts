import { NextRequest } from "next/server";
import { requireVerifiedAuth } from "@/lib/auth";
import { ok, handleError } from "@/lib/api-response";
import { upgradePlanSchema } from "@/lib/validations";
import { createPlanOrder } from "@/lib/services/payment";
import { db } from "@/lib/db";

// POST /api/billing/upgrade — create payment order for plan upgrade
export async function POST(req: NextRequest) {
  try {
    const user = await requireVerifiedAuth();
    const body = await req.json();
    const { plan, gateway, idempotencyKey } = upgradePlanSchema.parse(body);

    const key = idempotencyKey ?? `billing:${user.id}:${plan}:${gateway}`;
    const existing = await db.payment.findUnique({ where: { idempotencyKey: key } });
    if (existing?.providerOrderId || existing?.providerPaymentId) {
      return ok({
        gateway,
        orderId: existing.providerOrderId,
        paymentIntentId: existing.providerPaymentId,
        amount: existing.amount,
        currency: existing.currency,
        idempotent: true,
      });
    }

    const order = await createPlanOrder(user.id, plan, "INR", gateway);
    await db.payment.create({
      data: {
        userId: user.id,
        gateway,
        state: "CREATED",
        amount: order.amount,
        currency: order.currency,
        idempotencyKey: key,
        providerOrderId: "orderId" in order ? order.orderId : undefined,
        providerPaymentId: "clientSecret" in order ? order.clientSecret?.split("_secret_")[0] : undefined,
        metadata: { plan, purpose: "plan_upgrade" },
      },
    });
    return ok(order);
  } catch (err) {
    return handleError(err);
  }
}
