import Razorpay from "razorpay";
import Stripe from "stripe";
import crypto from "crypto";
import { db } from "@/lib/db";
import { PLAN_PRICING } from "./plan";
import type { PlanType } from "@prisma/client";

// ─── Clients ──────────────────────────────────────────────────────────────────

export const razorpay =
  process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
    ? new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      })
    : null;

export const stripe =
  process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-04-22.dahlia" })
    : null;

// ─── Settlement payment order ─────────────────────────────────────────────────

export async function createRazorpayOrder(
  settlementId: string,
  amount: number,
  currency: string,
  notes?: Record<string, string>
) {
  if (!razorpay) throw new Error("Razorpay not configured");

  const amountPaise = Math.round(amount * 100);
  const order = await razorpay.orders.create({
    amount: amountPaise,
    currency,
    receipt: `sett_${settlementId.slice(-8)}`,
    notes: notes ?? {},
  });

  await db.settlement.update({
    where: { id: settlementId },
    data: { razorpayOrderId: order.id, status: "PROCESSING", gateway: "RAZORPAY" },
  });

  return order;
}

export async function createStripePaymentIntent(
  settlementId: string,
  amount: number,
  currency: string,
  customerId?: string
) {
  if (!stripe) throw new Error("Stripe not configured");

  const amountCents = Math.round(amount * 100);
  const pi = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: currency.toLowerCase(),
    customer: customerId,
    metadata: { settlementId },
    automatic_payment_methods: { enabled: true },
  });

  await db.settlement.update({
    where: { id: settlementId },
    data: { stripePaymentId: pi.id, status: "PROCESSING", gateway: "STRIPE" },
  });

  return pi;
}

// ─── Webhook verification ─────────────────────────────────────────────────────

export function verifyRazorpayWebhook(
  rawBody: string,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
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
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) return null;
  try {
    return stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch {
    return null;
  }
}

// ─── Settlement confirmation ──────────────────────────────────────────────────

export async function confirmSettlement(
  settlementId: string,
  transactionId?: string
) {
  const settlement = await db.settlement.update({
    where: { id: settlementId },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
      transactionId,
    },
    include: { fromUser: true, toUser: true },
  });

  // Update user total_paid
  await db.user.update({
    where: { id: settlement.fromUserId },
    data: { totalPaid: { increment: settlement.amount } },
  });

  // Update streak
  await updatePaymentStreak(settlement.fromUserId);

  // Update group balance
  if (settlement.groupId) {
    await db.groupMember.updateMany({
      where: { groupId: settlement.groupId, userId: settlement.fromUserId },
      data: { balance: { increment: settlement.amount } },
    });
    await db.groupMember.updateMany({
      where: { groupId: settlement.groupId, userId: settlement.toUserId },
      data: { balance: { decrement: settlement.amount } },
    });
  }

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

  await db.user.update({
    where: { id: userId },
    data: {
      plan,
      planStatus: "ACTIVE",
      planStartedAt: now,
      planExpiresAt: expiresAt,
    },
  });

  await db.invoice.create({
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

  await db.auditLog.create({
    data: { userId, action: "PLAN_UPGRADED", resource: "User", resourceId: userId, metadata: { plan } },
  });
}
