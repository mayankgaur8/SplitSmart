import { NextRequest, NextResponse } from "next/server";
import { sendDuePaymentReminders, sendSubscriptionRenewalReminders } from "@/lib/services/notification";
import { logError, logInfo } from "@/lib/observability";

// GET /api/cron/reminders — called daily by Vercel Cron (9:00 AM IST)
export async function GET(req: NextRequest) {
  // Verify cron secret to prevent unauthorized invocations
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await Promise.all([
      sendDuePaymentReminders(),
      sendSubscriptionRenewalReminders(),
    ]);
    const ran = new Date().toISOString();
    logInfo("cron.reminders.completed", { ran });
    return NextResponse.json({ ok: true, ran });
  } catch (err) {
    logError("cron.reminders.failed", err);
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}
