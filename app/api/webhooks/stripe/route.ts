import { NextRequest, NextResponse } from "next/server";
import { verifyStripeWebhook, confirmSettlement, activatePlan } from "@/lib/services/payment";
import { db } from "@/lib/db";
import type { PlanType } from "@prisma/client";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";

  const event = verifyStripeWebhook(rawBody, signature);
  if (!event) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    if (event.type === "payment_intent.succeeded") {
      const pi = event.data.object as { id: string; metadata: Record<string, string> };
      const { settlementId, userId, plan } = pi.metadata;

      if (settlementId) {
        await confirmSettlement(settlementId, pi.id);
      }

      if (userId && plan) {
        await activatePlan(userId, plan as PlanType, pi.id, "STRIPE");
      }
    }

    if (event.type === "payment_intent.payment_failed") {
      const pi = event.data.object as { metadata: Record<string, string> };
      const { settlementId } = pi.metadata;
      if (settlementId) {
        await db.settlement.update({
          where: { id: settlementId },
          data: { status: "FAILED" },
        });
      }
    }

    if (event.type === "customer.subscription.deleted") {
      // Stripe recurring subscription cancelled
      const sub = event.data.object as { metadata: Record<string, string> };
      const { userId } = sub.metadata ?? {};
      if (userId) {
        await db.user.update({
          where: { id: userId },
          data: { planStatus: "CANCELLED" },
        });
      }
    }
  } catch (err) {
    console.error("[stripe-webhook]", err);
  }

  return NextResponse.json({ received: true });
}
