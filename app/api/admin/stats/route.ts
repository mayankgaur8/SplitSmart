import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/auth";
import { ok, handleError } from "@/lib/api-response";
import { PLAN_PRICING } from "@/lib/services/plan";

// GET /api/admin/stats — MRR, users, churn — SUPER_ADMIN only
export async function GET(_req: NextRequest) {
  try {
    await requireRole("SUPER_ADMIN");

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      totalUsers,
      newUsersThisMonth,
      proUsers,
      teamUsers,
      totalGroups,
      totalExpenses,
      totalSettlements,
      completedSettlements,
      recentInvoices,
    ] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { createdAt: { gte: monthStart } } }),
      db.user.count({ where: { plan: "PRO", planStatus: "ACTIVE" } }),
      db.user.count({ where: { plan: "TEAM", planStatus: "ACTIVE" } }),
      db.group.count({ where: { isArchived: false } }),
      db.expense.count({ where: { isDeleted: false } }),
      db.settlement.count(),
      db.settlement.count({ where: { status: "COMPLETED" } }),
      db.invoice.findMany({
        where: { createdAt: { gte: monthStart }, status: "PAID" },
        select: { amount: true, plan: true },
      }),
    ]);

    // Calculate MRR from active paid plans
    const mrr =
      proUsers * PLAN_PRICING.PRO.INR + teamUsers * PLAN_PRICING.TEAM.INR;

    // Revenue this month from invoices
    const revenueThisMonth = recentInvoices.reduce((sum, inv) => sum + inv.amount, 0);

    // Churn: cancelled this month
    const churnedThisMonth = await db.user.count({
      where: {
        planStatus: "CANCELLED",
        updatedAt: { gte: monthStart },
      },
    });

    // New paid users (churned from last month is approximate)
    const fraudFlags = await db.auditLog.count({
      where: {
        action: "FRAUD_FLAG",
        createdAt: { gte: monthStart },
      },
    });

    return ok({
      mrr,
      revenueThisMonth,
      totalUsers,
      newUsersThisMonth,
      paidUsers: proUsers + teamUsers,
      proUsers,
      teamUsers,
      churnedThisMonth,
      churnRate:
        totalUsers > 0 ? Math.round((churnedThisMonth / totalUsers) * 100 * 100) / 100 : 0,
      totalGroups,
      totalExpenses,
      settlementRate:
        totalSettlements > 0
          ? Math.round((completedSettlements / totalSettlements) * 100)
          : 0,
      fraudFlags,
      generatedAt: now.toISOString(),
    });
  } catch (err) {
    return handleError(err);
  }
}
