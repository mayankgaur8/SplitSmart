import { NextRequest } from "next/server";
import { requireVerifiedAuth } from "@/lib/auth";
import { ok, handleError } from "@/lib/api-response";
import { createPaymentOrderSchema } from "@/lib/validations";
import { createRazorpayOrder, createStripePaymentIntent } from "@/lib/services/payment";
import { db } from "@/lib/db";
import { getRequestId, tagSentryUser, withLatency } from "@/lib/observability";

// POST /api/payments/create-order
export async function POST(req: NextRequest) {
  const requestId = getRequestId(req);
  try {
    const user = await requireVerifiedAuth();
    tagSentryUser(user);
    const body = await req.json();
    const { settlementId, gateway, idempotencyKey } = createPaymentOrderSchema.parse(body);

    const settlement = await db.settlement.findUnique({
      where: { id: settlementId },
      include: { fromUser: true },
    });

    if (!settlement) throw Object.assign(new Error("Settlement not found"), { statusCode: 404 });
    if (settlement.fromUserId !== user.id) {
      throw Object.assign(new Error("Only the payer can initiate payment"), { statusCode: 403 });
    }
    if (settlement.status === "COMPLETED") {
      throw Object.assign(new Error("Settlement already completed"), { statusCode: 400 });
    }

    return await withLatency("payments.create_order", async () => {
      const key = idempotencyKey ?? `payment:${gateway}:${settlementId}:${user.id}`;

      if (gateway === "RAZORPAY") {
      const order = await createRazorpayOrder(
        settlementId,
        settlement.amount,
        settlement.currency,
        { settlementId, userId: user.id },
        key
      );
      return ok({
        gateway: "RAZORPAY",
        orderId: order.id,
        amount: settlement.amount,
        currency: settlement.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
      });
      }

      const dbUser = await db.user.findUnique({ where: { id: user.id }, select: { stripeCustomerId: true } });
      const pi = await createStripePaymentIntent(
        settlementId,
        settlement.amount,
        settlement.currency,
        dbUser?.stripeCustomerId ?? undefined,
        key
      );
      return ok({
        gateway: "STRIPE",
        clientSecret: pi.client_secret,
        amount: settlement.amount,
        currency: settlement.currency,
      });
    }, { requestId, userId: user.id, settlementId, gateway });
  } catch (err) {
    return handleError(err);
  }
}
