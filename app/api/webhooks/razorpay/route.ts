import { NextRequest, NextResponse } from "next/server";
import { verifyRazorpayWebhook, confirmSettlement, activatePlan, markPaymentFailed, recordWebhookEvent } from "@/lib/services/payment";
import { db } from "@/lib/db";
import { logError } from "@/lib/observability";
import type { PlanType } from "@prisma/client";

// Razorpay sends webhooks as application/json with X-Razorpay-Signature header
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";

  if (!verifyRazorpayWebhook(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventType = event.event as string;
  const payload = event.payload as Record<string, unknown>;
  const paymentEntity = (payload.payment as { entity?: Record<string, unknown> } | undefined)?.entity;
  const eventId = (event.id as string | undefined) ?? `${eventType}:${paymentEntity?.id ?? cryptoRandomFallback(rawBody)}`;
  const webhookEvent = await recordWebhookEvent({
    provider: "RAZORPAY",
    eventId,
    eventType,
    rawBody,
    signature,
  });

  if (webhookEvent.status === "PROCESSED") {
    return NextResponse.json({ received: true, replay: true });
  }

  try {
    if (eventType === "payment.captured") {
      const payment = (payload.payment as { entity: Record<string, unknown> }).entity;
      const notes = payment.notes as Record<string, string>;

      // Settlement payment
      if (notes.settlementId) {
        await confirmSettlement(notes.settlementId, payment.id as string, eventId);
      }

      // Plan upgrade payment
      if (notes.userId && notes.plan) {
        await activatePlan(notes.userId, notes.plan as PlanType, payment.id as string, "RAZORPAY");
      }
    }

    if (eventType === "payment.failed") {
      const payment = (payload.payment as { entity: Record<string, unknown> }).entity;
      const notes = payment.notes as Record<string, string>;

      if (notes.settlementId) {
        await markPaymentFailed(notes.settlementId, "Provider reported payment.failed", eventId);
      }
    }

    if (eventType === "order.paid") {
      // Order-level confirmation (backup for payment.captured)
      // Already handled above; no-op here
    }
    await db.webhookEvent.update({
      where: { id: webhookEvent.id },
      data: { status: "PROCESSED", processedAt: new Date() },
    });
  } catch (err) {
    logError("razorpay.webhook.failed", err, { eventId, eventType });
    await db.webhookEvent.update({
      where: { id: webhookEvent.id },
      data: { status: "FAILED", error: err instanceof Error ? err.message : "Unknown error" },
    });
  }

  return NextResponse.json({ received: true });
}

function cryptoRandomFallback(rawBody: string) {
  return Buffer.from(rawBody).toString("base64url").slice(0, 48);
}
