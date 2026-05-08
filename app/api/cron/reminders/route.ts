import { NextRequest, NextResponse } from "next/server";
import { sendDuePaymentReminders, sendSubscriptionRenewalReminders } from "@/lib/services/notification";

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
    return NextResponse.json({ ok: true, ran: new Date().toISOString() });
  } catch (err) {
    console.error("[cron/reminders]", err);
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}
