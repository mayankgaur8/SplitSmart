import { NextRequest, NextResponse } from "next/server";
import { verifyStripeWebhook, confirmSettlement, activatePlan, markPaymentFailed, recordWebhookEvent } from "@/lib/services/payment";
import { db } from "@/lib/db";
import { logError } from "@/lib/observability";
import type { PlanType } from "@prisma/client";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";

  const event = verifyStripeWebhook(rawBody, signature);
  if (!event) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  const webhookEvent = await recordWebhookEvent({
    provider: "STRIPE",
    eventId: event.id,
    eventType: event.type,
    rawBody,
    signature,
  });

  if (webhookEvent.status === "PROCESSED") {
    return NextResponse.json({ received: true, replay: true });
  }

  try {
    if (event.type === "payment_intent.succeeded") {
      const pi = event.data.object as { id: string; metadata: Record<string, string> };
      const { settlementId, userId, plan } = pi.metadata;

      if (settlementId) {
        await confirmSettlement(settlementId, pi.id, event.id);
      }

      if (userId && plan) {
        await activatePlan(userId, plan as PlanType, pi.id, "STRIPE");
      }
    }

    if (event.type === "payment_intent.payment_failed") {
      const pi = event.data.object as { metadata: Record<string, string> };
      const { settlementId } = pi.metadata;
      if (settlementId) {
        await markPaymentFailed(settlementId, "Stripe payment_intent.payment_failed", event.id);
      }
    }

    if (event.type === "customer.subscription.deleted") {
      // Stripe recurring subscription cancelled
      const sub = event.data.object as { metadata: Record<string, string> };
      const { userId } = sub.metadata ?? {};
      if (userId) {
        await db.user.update({
          where: { id: userId },
          data: { planStatus: "CANCELLED", cancelEffectiveAt: new Date() },
        });
      }
    }
    await db.webhookEvent.update({
      where: { id: webhookEvent.id },
      data: { status: "PROCESSED", processedAt: new Date() },
    });
  } catch (err) {
    logError("stripe.webhook.failed", err, { eventId: event.id, eventType: event.type });
    await db.webhookEvent.update({
      where: { id: webhookEvent.id },
      data: { status: "FAILED", error: err instanceof Error ? err.message : "Unknown error" },
    });
  }

  return NextResponse.json({ received: true });
}
