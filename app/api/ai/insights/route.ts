import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { ok, handleError } from "@/lib/api-response";
import { canUseFeature } from "@/lib/services/plan";
import { generateSpendingInsights } from "@/lib/services/ai";
import { db } from "@/lib/db";
import type { PlanType, PlanStatus } from "@prisma/client";

// GET /api/ai/insights — spending insights for the authenticated user
export async function GET(_req: NextRequest) {
  try {
    const user = await requireAuth();
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { plan: true, planStatus: true },
    });
    if (!dbUser) throw new Error("User not found");

    if (!canUseFeature(dbUser.plan as PlanType, dbUser.planStatus as PlanStatus, "aiInsights")) {
      return handleError(
        Object.assign(new Error("AI insights require Pro plan"), {
          statusCode: 403,
          code: "PLAN_LIMIT_EXCEEDED",
          trigger: "ai_insights",
        })
      );
    }

    // Gather last 30 days of expense data
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const [expenses, subs, dbUserFull] = await Promise.all([
      db.expense.findMany({
        where: { paidById: user.id, createdAt: { gte: since }, isDeleted: false },
        select: { amount: true, category: true, createdAt: true },
      }),
      db.subscription.findMany({
        where: { userId: user.id, isActive: true },
        select: { name: true, monthlyCost: true, usageScore: true },
      }),
      db.user.findUnique({ where: { id: user.id }, select: { paymentStreak: true } }),
    ]);

    // Build context object for insights generator
    const categoryBreakdown: Record<string, number> = {};
    const monthlyTotals: Record<string, number> = {};
    for (const e of expenses) {
      const cat = e.category as string;
      categoryBreakdown[cat] = (categoryBreakdown[cat] ?? 0) + e.amount;
      const month = e.createdAt.toISOString().slice(0, 7);
      monthlyTotals[month] = (monthlyTotals[month] ?? 0) + e.amount;
    }

    const insights = await generateSpendingInsights({
      monthlyTotals,
      categoryBreakdown,
      subscriptions: subs.map((s) => ({ name: s.name, cost: s.monthlyCost, usageScore: s.usageScore ?? 50 })),
      streakDays: dbUserFull?.paymentStreak ?? 0,
    });
    return ok({ insights, generatedAt: new Date().toISOString() });
  } catch (err) {
    return handleError(err);
  }
}
