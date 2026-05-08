import { Resend } from "resend";
import { db } from "@/lib/db";
import type { NotificationType } from "@prisma/client";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// ─── In-app notification ──────────────────────────────────────────────────────

export async function createInAppNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  options?: {
    actionUrl?: string;
    metadata?: Record<string, unknown>;
  }
) {
  return db.notification.create({
    data: {
      userId,
      type,
      channel: "IN_APP",
      title,
      body,
      actionUrl: options?.actionUrl,
      metadata: options?.metadata as never,
    },
  });
}

// ─── Email templates ──────────────────────────────────────────────────────────

const emailTemplates = {
  payment_due: (name: string, amount: string, groupName: string, dueDate: string) => ({
    subject: `⏰ ${amount} due to ${groupName}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#060914;color:#f1f5f9;padding:32px;border-radius:16px;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;">
          <div style="width:36px;height:36px;background:linear-gradient(135deg,#0ea5e9,#8b5cf6);border-radius:10px;display:flex;align-items:center;justify-content:center;">
            ⚡
          </div>
          <span style="font-weight:800;font-size:18px;">SplitSmart</span>
        </div>
        <h2 style="margin:0 0 12px;color:#fff;">Hey ${name}, you have a payment due</h2>
        <p style="color:#94a3b8;margin:0 0 24px;">
          <strong style="color:#f1f5f9;">${amount}</strong> is due for
          <strong style="color:#f1f5f9;">${groupName}</strong> by ${dueDate}.
        </p>
        <a href="${process.env.NEXTAUTH_URL}/settlements"
           style="display:inline-block;background:linear-gradient(135deg,#0ea5e9,#8b5cf6);color:#fff;
                  padding:12px 28px;border-radius:12px;text-decoration:none;font-weight:700;">
          Pay Now →
        </a>
        <p style="color:#475569;font-size:12px;margin-top:32px;">
          You're receiving this because you're a member of SplitSmart.
          <a href="${process.env.NEXTAUTH_URL}/settings" style="color:#38bdf8;">Unsubscribe</a>
        </p>
      </div>
    `,
  }),

  payment_received: (name: string, fromName: string, amount: string) => ({
    subject: `✅ ${fromName} paid you ${amount}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#060914;color:#f1f5f9;padding:32px;border-radius:16px;">
        <h2 style="color:#10b981;">Payment Received! 🎉</h2>
        <p style="color:#94a3b8;">
          <strong style="color:#f1f5f9;">${fromName}</strong> paid you
          <strong style="color:#10b981;">${amount}</strong>.
        </p>
        <a href="${process.env.NEXTAUTH_URL}/settlements"
           style="display:inline-block;background:#10b981;color:#fff;padding:12px 28px;border-radius:12px;text-decoration:none;font-weight:700;">
          View Settlement →
        </a>
      </div>
    `,
  }),

  subscription_renewal: (name: string, subName: string, amount: string, date: string) => ({
    subject: `📅 ${subName} renews on ${date} — ${amount}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#060914;color:#f1f5f9;padding:32px;border-radius:16px;">
        <h2 style="color:#f59e0b;">Subscription Renewing Soon</h2>
        <p style="color:#94a3b8;">
          <strong style="color:#f1f5f9;">${subName}</strong> auto-renews on
          <strong style="color:#f59e0b;">${date}</strong> for
          <strong style="color:#f1f5f9;">${amount}</strong>.
        </p>
        <a href="${process.env.NEXTAUTH_URL}/subscriptions"
           style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#ef4444);color:#fff;padding:12px 28px;border-radius:12px;text-decoration:none;font-weight:700;">
          Manage Subscriptions →
        </a>
      </div>
    `,
  }),

  welcome: (name: string) => ({
    subject: `Welcome to SplitSmart, ${name}! 🎉`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#060914;color:#f1f5f9;padding:32px;border-radius:16px;">
        <h2 style="color:#38bdf8;">Your shared money OS is ready</h2>
        <p style="color:#94a3b8;">
          Hi ${name}, welcome to SplitSmart! Start by creating your first group and inviting your flatmates, travel buddies, or team.
        </p>
        <a href="${process.env.NEXTAUTH_URL}/dashboard"
           style="display:inline-block;background:linear-gradient(135deg,#0ea5e9,#8b5cf6);color:#fff;padding:12px 28px;border-radius:12px;text-decoration:none;font-weight:700;">
          Go to Dashboard →
        </a>
      </div>
    `,
  }),

  invite: (name: string, groupName: string, inviteUrl: string) => ({
    subject: `${name} invited you to ${groupName} on SplitSmart`,
    html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#060914;color:#f1f5f9;padding:32px;border-radius:16px;"><h2>Join ${groupName}</h2><p style="color:#94a3b8;">${name} invited you to split expenses together.</p><a href="${inviteUrl}" style="display:inline-block;background:#0ea5e9;color:#fff;padding:12px 28px;border-radius:12px;text-decoration:none;font-weight:700;">Accept Invite</a></div>`,
  }),

  settlement_success: (name: string, amount: string) => ({
    subject: `Settlement complete: ${amount}`,
    html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#060914;color:#f1f5f9;padding:32px;border-radius:16px;"><h2 style="color:#10b981;">Settlement successful</h2><p style="color:#94a3b8;">Hi ${name}, your ${amount} settlement is marked paid.</p></div>`,
  }),

  plan_upgrade: (name: string, plan: string) => ({
    subject: `Welcome to SplitSmart ${plan}`,
    html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#060914;color:#f1f5f9;padding:32px;border-radius:16px;"><h2>Your ${plan} plan is active</h2><p style="color:#94a3b8;">Hi ${name}, paid features are now unlocked.</p></div>`,
  }),

  failed_payment: (name: string, amount: string) => ({
    subject: `Payment failed for ${amount}`,
    html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#060914;color:#f1f5f9;padding:32px;border-radius:16px;"><h2 style="color:#ef4444;">Payment failed</h2><p style="color:#94a3b8;">Hi ${name}, your ${amount} payment did not complete. Please retry or use another method.</p></div>`,
  }),

  password_reset: (name: string, resetUrl: string) => ({
    subject: "Reset your SplitSmart password",
    html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#060914;color:#f1f5f9;padding:32px;border-radius:16px;"><h2>Password reset</h2><p style="color:#94a3b8;">Hi ${name}, this link expires in 30 minutes.</p><a href="${resetUrl}" style="display:inline-block;background:#0ea5e9;color:#fff;padding:12px 28px;border-radius:12px;text-decoration:none;font-weight:700;">Reset Password</a></div>`,
  }),
};

// ─── Send email ───────────────────────────────────────────────────────────────

export async function sendEmail(
  to: string,
  template: keyof typeof emailTemplates,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: any[]
) {
  if (!resend) {
    console.log(`[Email skipped — no RESEND_API_KEY] to=${to} template=${template}`);
    return;
  }
  const { subject, html } = (emailTemplates[template] as (...a: unknown[]) => { subject: string; html: string })(...args);
  try {
    await resend.emails.send({
      from: `SplitSmart <no-reply@${process.env.EMAIL_DOMAIN ?? "splitsmart.io"}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error("[Email send error]", err);
    await db.auditLog.create({
      data: {
        action: "FRAUD_FLAGGED",
        resource: "Notification",
        metadata: {
          status: "FAILED",
          channel: "EMAIL",
          to,
          template,
          error: err instanceof Error ? err.message : "Unknown error",
        },
      },
    }).catch(() => {});
  }
}

// ─── WhatsApp (Twilio/Meta Cloud API) ────────────────────────────────────────

export async function sendWhatsApp(to: string, message: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) {
    console.log(`[WhatsApp skipped — Twilio not configured] to=${to}`);
    return;
  }
  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const body = new URLSearchParams({
    From: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM ?? "+14155238886"}`,
    To: `whatsapp:${to}`,
    Body: message,
  });
  const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
  await fetch(endpoint, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body,
  }).catch((err) => console.error("[WhatsApp error]", err));
}

// ─── Batch reminder scheduler (called by cron) ───────────────────────────────

export async function sendDuePaymentReminders() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Find unpaid expense splits where due date is tomorrow or overdue
  const overdueSplits = await db.expenseSplit.findMany({
    where: { isPaid: false },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, whatsappConsent: true } },
      expense: { select: { title: true, amount: true, currency: true } },
    },
    take: 500,
  });

  for (const split of overdueSplits) {
    const user = split.user;
    if (!user.email) continue;

    await createInAppNotification(
      user.id,
      "PAYMENT_DUE",
      `Payment overdue: ${split.expense.title}`,
      `Your share of ${split.expense.currency} ${split.amount.toFixed(0)} is overdue.`,
      { actionUrl: "/settlements" }
    );

    await sendEmail(
      user.email,
      "payment_due",
      [
        user.name ?? "there",
        `${split.expense.currency} ${split.amount.toFixed(0)}`,
        split.expense.title,
        "as soon as possible",
      ]
    );

    if (user.phone && user.whatsappConsent) {
      await sendWhatsApp(
        user.phone,
        `Hey ${user.name ?? "there"}! 👋 Your payment of ₹${split.amount.toFixed(0)} for *${split.expense.title}* is pending. Settle it now: ${process.env.NEXTAUTH_URL}/settlements`
      );
    }
  }
}

export async function sendSubscriptionRenewalReminders() {
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

  const renewingSubs = await db.subscription.findMany({
    where: {
      isActive: true,
      renewalDate: { lte: threeDaysFromNow },
    },
    include: {
      groupSubscriptions: {
        include: {
          group: {
            include: {
              members: {
                include: {
                  user: { select: { id: true, name: true, email: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  for (const sub of renewingSubs) {
    for (const gs of sub.groupSubscriptions) {
      for (const member of gs.group.members) {
        const user = member.user;
        if (!user.email) continue;
        await createInAppNotification(
          user.id,
          "SUBSCRIPTION_RENEWAL",
          `${sub.name} renews soon`,
          `${sub.name} auto-renews on ${sub.renewalDate.toLocaleDateString("en-IN")}. Your share: ₹${gs.costPerPerson}.`,
          { actionUrl: "/subscriptions" }
        );
      }
    }
  }
}
