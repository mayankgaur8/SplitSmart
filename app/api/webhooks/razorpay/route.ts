import { NextRequest, NextResponse } from "next/server";
import { verifyRazorpayWebhook, confirmSettlement, activatePlan } from "@/lib/services/payment";
import { db } from "@/lib/db";
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

  try {
    if (eventType === "payment.captured") {
      const payment = (payload.payment as { entity: Record<string, unknown> }).entity;
      const notes = payment.notes as Record<string, string>;

      // Settlement payment
      if (notes.settlementId) {
        await confirmSettlement(notes.settlementId, payment.id as string);
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
        await db.settlement.update({
          where: { id: notes.settlementId },
          data: { status: "FAILED" },
        });
      }
    }

    if (eventType === "order.paid") {
      // Order-level confirmation (backup for payment.captured)
      // Already handled above; no-op here
    }
  } catch (err) {
    console.error("[razorpay-webhook]", err);
    // Return 200 to prevent Razorpay from retrying on our processing errors
  }

  return NextResponse.json({ received: true });
}
