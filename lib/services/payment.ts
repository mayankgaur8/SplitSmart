import Razorpay from "razorpay";
import Stripe from "stripe";
import crypto from "crypto";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { logError } from "@/lib/observability";
import { PLAN_PRICING } from "./plan";
import type { PlanType } from "@prisma/client";

// ─── Clients ──────────────────────────────────────────────────────────────────

export const razorpay =
  env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET
    ? new Razorpay({
        key_id: env.RAZORPAY_KEY_ID,
        key_secret: env.RAZORPAY_KEY_SECRET,
      })
    : null;

export const stripe =
  env.STRIPE_SECRET_KEY
    ? new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: "2026-04-22.dahlia" })
    : null;

// ─── Settlement payment order ─────────────────────────────────────────────────

export async function createRazorpayOrder(
  settlementId: string,
  amount: number,
  currency: string,
  notes?: Record<string, string>,
  idempotencyKey = `settlement:${settlementId}:razorpay`
) {
  if (!razorpay) throw new Error("Razorpay not configured");

  const existing = await db.payment.findUnique({ where: { idempotencyKey } });
  if (existing?.providerOrderId) {
    return { id: existing.providerOrderId, amount: Math.round(amount * 100), currency };
  }

  const amountPaise = Math.round(amount * 100);
  const order = await razorpay.orders.create({
    amount: amountPaise,
    currency,
    receipt: `sett_${settlementId.slice(-8)}`,
    notes: notes ?? {},
  });

  await db.$transaction(async (tx) => {
    await tx.payment.upsert({
      where: { idempotencyKey },
      create: {
        userId: notes?.userId ?? "",
        settlementId,
        gateway: "RAZORPAY",
        state: "CREATED",
        amount,
        currency,
        idempotencyKey,
        providerOrderId: order.id,
        metadata: notes ?? {},
      },
      update: { providerOrderId: order.id, state: "CREATED" },
    });
    await tx.settlement.update({
      where: { id: settlementId },
      data: { razorpayOrderId: order.id, status: "PROCESSING", gateway: "RAZORPAY", idempotencyKey },
    });
  });

  return order;
}

export async function createStripePaymentIntent(
  settlementId: string,
  amount: number,
  currency: string,
  customerId?: string,
  idempotencyKey = `settlement:${settlementId}:stripe`
) {
  if (!stripe) throw new Error("Stripe not configured");

  const existing = await db.payment.findUnique({ where: { idempotencyKey } });
  if (existing?.providerPaymentId) {
    return { id: existing.providerPaymentId, client_secret: null };
  }

  const amountCents = Math.round(amount * 100);
  const pi = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: currency.toLowerCase(),
    customer: customerId,
    metadata: { settlementId },
    automatic_payment_methods: { enabled: true },
  });

  await db.$transaction(async (tx) => {
    const settlement = await tx.settlement.findUnique({ where: { id: settlementId }, select: { fromUserId: true } });
    await tx.payment.upsert({
      where: { idempotencyKey },
      create: {
        userId: settlement?.fromUserId ?? "",
        settlementId,
        gateway: "STRIPE",
        state: "CREATED",
        amount,
        currency,
        idempotencyKey,
        providerPaymentId: pi.id,
        metadata: { settlementId },
      },
      update: { providerPaymentId: pi.id, state: "CREATED" },
    });
    await tx.settlement.update({
      where: { id: settlementId },
      data: { stripePaymentId: pi.id, status: "PROCESSING", gateway: "STRIPE", idempotencyKey },
    });
  });

  return pi;
}

// ─── Webhook verification ─────────────────────────────────────────────────────

export function verifyRazorpayWebhook(
  rawBody: string,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET ?? env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    );
  } catch {
    return false;
  }
}

export function verifyStripeWebhook(
  rawBody: string,
  signature: string
): Stripe.Event | null {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !webhookSecret) return null;
  try {
    return stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret
    );
  } catch {
    return null;
  }
}

// ─── Settlement confirmation ──────────────────────────────────────────────────

export async function confirmSettlement(
  settlementId: string,
  transactionId?: string,
  providerEventId?: string
) {
  const now = new Date();
  const settlement = await db.$transaction(async (tx) => {
    const current = await tx.settlement.findUnique({
      where: { id: settlementId },
      include: { fromUser: true, toUser: true },
    });
    if (!current) throw Object.assign(new Error("Settlement not found"), { statusCode: 404 });
    if (current.status === "COMPLETED") return current;

    const updated = await tx.settlement.update({
      where: { id: settlementId },
      data: {
        status: "COMPLETED",
        completedAt: now,
        transactionId,
        providerEventId,
        razorpayPaymentId: current.gateway === "RAZORPAY" ? transactionId : current.razorpayPaymentId,
        stripePaymentId: current.gateway === "STRIPE" ? transactionId : current.stripePaymentId,
      },
      include: { fromUser: true, toUser: true },
    });

    await tx.payment.updateMany({
      where: {
        OR: [
          { settlementId },
          ...(transactionId ? [{ providerPaymentId: transactionId }] : []),
        ],
      },
      data: {
        state: "SUCCESS",
        providerPaymentId: transactionId,
        providerEventId,
        succeededAt: now,
      },
    });

    await tx.user.update({
      where: { id: current.fromUserId },
      data: { totalPaid: { increment: current.amount } },
    });

    if (current.groupId) {
      await tx.groupMember.updateMany({
        where: { groupId: current.groupId, userId: current.fromUserId },
        data: { balance: { increment: current.amount } },
      });
      await tx.groupMember.updateMany({
        where: { groupId: current.groupId, userId: current.toUserId },
        data: { balance: { decrement: current.amount } },
      });
    }

    await tx.auditLog.create({
      data: {
        userId: current.fromUserId,
        action: "SETTLEMENT_COMPLETED",
        resource: "Settlement",
        resourceId: settlementId,
        metadata: { transactionId, providerEventId },
      },
    });

    return updated;
  });

  await updatePaymentStreak(settlement.fromUserId);

  return settlement;
}

async function updatePaymentStreak(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { paymentStreak: true, lastPaymentAt: true, longestStreak: true },
  });
  if (!user) return;

  const now = new Date();
  const lastPayment = user.lastPaymentAt;
  let newStreak = 1;

  if (lastPayment) {
    const diffDays = Math.floor(
      (now.getTime() - lastPayment.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays === 1) {
      newStreak = user.paymentStreak + 1;
    } else if (diffDays === 0) {
      newStreak = user.paymentStreak;
    }
  }

  await db.user.update({
    where: { id: userId },
    data: {
      paymentStreak: newStreak,
      longestStreak: Math.max(newStreak, user.longestStreak),
      lastPaymentAt: now,
    },
  });

  // Award streak badges
  const milestones = [7, 30, 100];
  for (const days of milestones) {
    if (newStreak === days) {
      const badge = await db.badge.findUnique({ where: { slug: `streak_${days}` } });
      if (badge) {
        await db.userBadge
          .create({ data: { userId, badgeId: badge.id } })
          .catch(() => {});
      }
    }
  }
}

// ─── SaaS Plan billing ────────────────────────────────────────────────────────

export async function createPlanOrder(
  userId: string,
  plan: PlanType,
  currency: "INR" | "USD" = "INR",
  gateway: "RAZORPAY" | "STRIPE" = "RAZORPAY"
) {
  const price = PLAN_PRICING[plan][currency];
  if (price === 0) throw new Error("Cannot bill for free plan");

  if (gateway === "RAZORPAY") {
    if (!razorpay) throw new Error("Razorpay not configured");
    const order = await razorpay.orders.create({
      amount: price * 100,
      currency,
      receipt: `plan_${userId.slice(-8)}_${Date.now()}`,
      notes: { userId, plan },
    });
    return { gateway: "RAZORPAY", orderId: order.id, amount: price, currency };
  }

  if (!stripe) throw new Error("Stripe not configured");
  const user = await db.user.findUnique({ where: { id: userId } });
  let customerId = user?.stripeCustomerId ?? undefined;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user?.email ?? undefined,
      name: user?.name ?? undefined,
      metadata: { userId },
    });
    customerId = customer.id;
    await db.user.update({ where: { id: userId }, data: { stripeCustomerId: customerId } });
  }

  const pi = await stripe.paymentIntents.create({
    amount: price * 100,
    currency: currency.toLowerCase(),
    customer: customerId,
    metadata: { userId, plan },
  });
  return { gateway: "STRIPE", clientSecret: pi.client_secret, amount: price, currency };
}

export async function activatePlan(
  userId: string,
  plan: PlanType,
  paymentId: string,
  gateway: "RAZORPAY" | "STRIPE"
) {
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setMonth(expiresAt.getMonth() + 1);

  await db.$transaction(async (tx) => {
    const existingInvoice = await tx.invoice.findFirst({
      where: gateway === "RAZORPAY" ? { razorpayPaymentId: paymentId } : { stripePaymentId: paymentId },
    });
    if (existingInvoice) return;

    await tx.user.update({
      where: { id: userId },
      data: {
        plan,
        planStatus: "ACTIVE",
        planStartedAt: now,
        planExpiresAt: expiresAt,
        graceEndsAt: null,
        cancelEffectiveAt: null,
      },
    });

    await tx.invoice.create({
      data: {
        userId,
        amount: PLAN_PRICING[plan]["INR"],
        currency: "INR",
        plan,
        status: "PAID",
        [gateway === "RAZORPAY" ? "razorpayPaymentId" : "stripePaymentId"]: paymentId,
        paidAt: now,
        periodStart: now,
        periodEnd: expiresAt,
      },
    });

    await tx.auditLog.create({
      data: { userId, action: "PLAN_UPGRADED", resource: "User", resourceId: userId, metadata: { plan } },
    });
  });
}

export async function markPaymentFailed(settlementId: string, reason: string, providerEventId?: string) {
  const now = new Date();
  await db.$transaction([
    db.settlement.update({
      where: { id: settlementId },
      data: { status: "FAILED", failureReason: reason, providerEventId },
    }),
    db.payment.updateMany({
      where: { settlementId },
      data: { state: "FAILED", failureReason: reason, providerEventId, failedAt: now },
    }),
  ]).catch((err) => logError("payment.mark_failed", err, { settlementId, providerEventId }));
}

export async function recordWebhookEvent(params: {
  provider: "RAZORPAY" | "STRIPE";
  eventId: string;
  eventType: string;
  rawBody: string;
  signature?: string;
}) {
  const signatureHash = params.signature
    ? crypto.createHash("sha256").update(params.signature).digest("hex")
    : undefined;
  return db.webhookEvent.upsert({
    where: { provider_eventId: { provider: params.provider, eventId: params.eventId } },
    create: {
      provider: params.provider,
      eventId: params.eventId,
      eventType: params.eventType,
      payload: JSON.parse(params.rawBody),
      signatureHash,
    },
    update: {},
  });
}
