import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logError, logInfo } from "@/lib/observability";

// GET /api/cron/recurring — spawns recurring expenses past their due date
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const due = await db.expense.findMany({
      where: {
        isRecurring: true,
        isDeleted: false,
        nextDueDate: { lte: now },
      },
      include: { splits: true },
    });

    let created = 0;
    for (const parent of due) {
      // Clone expense as a new record
      const next = await db.expense.create({
        data: {
          groupId: parent.groupId,
          title: parent.title,
          amount: parent.amount,
          currency: parent.currency,
          category: parent.category,
          splitType: parent.splitType,
          paidById: parent.paidById,
          createdById: parent.createdById,
          notes: parent.notes,
          tags: parent.tags,
          isRecurring: true,
          recurringInterval: parent.recurringInterval,
          parentExpenseId: parent.id,
          splits: {
            create: parent.splits.map((s) => ({
              userId: s.userId,
              amount: s.amount,
              percentage: s.percentage,
              shares: s.shares,
              isPaid: s.userId === parent.paidById,
            })),
          },
        },
      });

      // Advance nextDueDate on the parent
      const interval = parent.recurringInterval;
      const nextDue = new Date(parent.nextDueDate ?? now);
      if (interval === "DAILY") nextDue.setDate(nextDue.getDate() + 1);
      else if (interval === "WEEKLY") nextDue.setDate(nextDue.getDate() + 7);
      else if (interval === "MONTHLY") nextDue.setMonth(nextDue.getMonth() + 1);
      else if (interval === "YEARLY") nextDue.setFullYear(nextDue.getFullYear() + 1);

      await db.expense.update({
        where: { id: parent.id },
        data: { nextDueDate: nextDue },
      });

      created++;
    }

    logInfo("cron.recurring.completed", { created, ran: now.toISOString() });
    return NextResponse.json({ ok: true, created, ran: now.toISOString() });
  } catch (err) {
    logError("cron.recurring.failed", err);
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}
