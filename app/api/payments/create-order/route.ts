import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { ok, handleError } from "@/lib/api-response";
import { createPaymentOrderSchema } from "@/lib/validations";
import { createRazorpayOrder, createStripePaymentIntent } from "@/lib/services/payment";
import { db } from "@/lib/db";

// POST /api/payments/create-order
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { settlementId, gateway } = createPaymentOrderSchema.parse(body);

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

    if (gateway === "RAZORPAY") {
      const order = await createRazorpayOrder(
        settlementId,
        settlement.amount,
        settlement.currency,
        { settlementId, userId: user.id }
      );
      return ok({
        gateway: "RAZORPAY",
        orderId: order.id,
        amount: settlement.amount,
        currency: settlement.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
      });
    }

    // Stripe
    const dbUser = await db.user.findUnique({ where: { id: user.id }, select: { stripeCustomerId: true } });
    const pi = await createStripePaymentIntent(
      settlementId,
      settlement.amount,
      settlement.currency,
      dbUser?.stripeCustomerId ?? undefined
    );
    return ok({
      gateway: "STRIPE",
      clientSecret: pi.client_secret,
      amount: settlement.amount,
      currency: settlement.currency,
    });
  } catch (err) {
    return handleError(err);
  }
}
