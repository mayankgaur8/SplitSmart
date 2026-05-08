import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { createExpenseSchema, paginationSchema } from "@/lib/validations";
import { ok, created, handleError } from "@/lib/api-response";
import { canUseFeature, isWithinLimit } from "@/lib/services/plan";
import { invalidateCache, getCached, setCached } from "@/lib/redis";
import { categorizeExpense } from "@/lib/services/ai";
import { requireGroupMember } from "@/lib/tenant";
import type { PlanType, PlanStatus } from "@prisma/client";

// GET /api/expenses — list expenses across groups or within a group
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get("groupId");
    const { page, limit, search } = paginationSchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      search: searchParams.get("search"),
    });

    const cacheKey = `expenses:${user.id}:${groupId ?? "all"}:${page}:${limit}:${search ?? ""}`;
    const cached = await getCached(cacheKey);
    if (cached) return ok(cached);

    // Scope: if groupId provided, check membership
    let groupIds: string[];
    if (groupId) {
      const member = await db.groupMember.findFirst({
        where: { groupId, userId: user.id, removedAt: null },
      });
      if (!member) throw Object.assign(new Error("Not a member of this group"), { statusCode: 403 });
      groupIds = [groupId];
    } else {
      const memberships = await db.groupMember.findMany({
        where: { userId: user.id, removedAt: null },
        select: { groupId: true },
      });
      groupIds = memberships.map((m) => m.groupId);
    }

    const where = {
      groupId: { in: groupIds },
      isDeleted: false,
      ...(search ? { title: { contains: search, mode: "insensitive" as const } } : {}),
    };

    const [expenses, total] = await Promise.all([
      db.expense.findMany({
        where,
        include: {
          paidBy: { select: { id: true, name: true, image: true } },
          group: { select: { id: true, name: true, currency: true } },
          splits: {
            include: { user: { select: { id: true, name: true, image: true } } },
          },
          _count: { select: { splits: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.expense.count({ where }),
    ]);

    const result = expenses.map((e) => ({
      ...e,
      mySplit: e.splits.find((s) => s.userId === user.id),
    }));

    await setCached(cacheKey, result, 30);
    return ok(result, { page, limit, total, hasNext: page * limit < total });
  } catch (err) {
    return handleError(err);
  }
}

// POST /api/expenses — create expense
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { plan: true, planStatus: true },
    });
    if (!dbUser) throw new Error("User not found");

    // Monthly expense limit check
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const expenseCount = await db.expense.count({
      where: { paidById: user.id, createdAt: { gte: monthStart }, isDeleted: false },
    });
    if (!isWithinLimit(dbUser.plan as PlanType, dbUser.planStatus as PlanStatus, "maxExpensesPerMonth", expenseCount)) {
      return handleError(
        Object.assign(new Error("Monthly expense limit reached. Upgrade to Pro for unlimited expenses."), {
          statusCode: 403,
          code: "PLAN_LIMIT_EXCEEDED",
          trigger: "expense_limit",
        })
      );
    }

    const body = await req.json();
    const data = createExpenseSchema.parse(body);

    // Verify group membership
    await requireGroupMember(user.id, data.groupId);

    // AI categorization if no explicit category (Pro feature, graceful fallback)
    let category = data.category;
    if (canUseFeature(dbUser.plan as PlanType, dbUser.planStatus as PlanStatus, "aiInsights")) {
      const aiCategory = await categorizeExpense(data.title, data.amount);
      if (aiCategory) category = aiCategory as typeof category;
    }

    // Calculate equal splits if not provided
    let splits = data.splits;
    if (data.splitType === "EQUAL" && splits.length === 0) {
      const members = await db.groupMember.findMany({
        where: { groupId: data.groupId, removedAt: null },
        select: { userId: true },
      });
      const share = data.amount / members.length;
      splits = members.map((m) => ({ userId: m.userId, amount: Math.round(share * 100) / 100 }));
    }

    const participantIds = [...new Set([data.paidById, ...splits.map((s) => s.userId)])];
    const participantCount = await db.groupMember.count({
      where: { groupId: data.groupId, userId: { in: participantIds }, removedAt: null },
    });
    if (participantCount !== participantIds.length) {
      throw Object.assign(new Error("All payers and split members must belong to the group"), { statusCode: 403 });
    }

    const expense = await db.$transaction(async (tx) => {
      const createdExpense = await tx.expense.create({
        data: {
          groupId: data.groupId,
          title: data.title,
          amount: data.amount,
          currency: data.currency,
          category,
          splitType: data.splitType,
          paidById: data.paidById,
          notes: data.notes,
          tags: data.tags,
          isRecurring: data.isRecurring,
          recurringInterval: data.recurringInterval,
          createdById: user.id,
          splits: {
            create: splits.map((s) => ({
              userId: s.userId,
              amount: s.amount,
              percentage: s.percentage,
              shares: s.shares,
              isPaid: s.userId === data.paidById,
            })),
          },
        },
        include: {
          paidBy: { select: { id: true, name: true, image: true } },
          splits: { include: { user: { select: { id: true, name: true } } } },
        },
      });

      const othersTotal = splits.filter((s) => s.userId !== data.paidById).reduce((sum, s) => sum + s.amount, 0);
      await tx.groupMember.updateMany({
        where: { groupId: data.groupId, userId: data.paidById },
        data: { balance: { increment: othersTotal } },
      });

      for (const split of splits) {
        if (split.userId === data.paidById) continue;
        await tx.groupMember.updateMany({
          where: { groupId: data.groupId, userId: split.userId },
          data: { balance: { decrement: split.amount } },
        });
      }

      await tx.auditLog.create({
        data: { userId: user.id, action: "EXPENSE_CREATED", resource: "Expense", resourceId: createdExpense.id },
      });

      return createdExpense;
    });

    // Notifications for split members (non-blocking)
    notifyExpenseSplits(expense.id, data.groupId, data.paidById, data.title, data.amount, splits).catch(() => {});

    await invalidateCache(`expenses:${user.id}:*`);
    return created(expense);
  } catch (err) {
    return handleError(err);
  }
}

async function notifyExpenseSplits(
  expenseId: string,
  groupId: string,
  paidById: string,
  title: string,
  _amount: number,
  splits: { userId: string; amount: number }[]
) {
  const payer = await db.user.findUnique({ where: { id: paidById }, select: { name: true } });
  const group = await db.group.findUnique({ where: { id: groupId }, select: { name: true } });

  for (const split of splits) {
    if (split.userId === paidById) continue;
    await db.notification.create({
      data: {
        userId: split.userId,
        type: "EXPENSE_ADDED",
        channel: "IN_APP",
        title: `New expense in ${group?.name}`,
        body: `${payer?.name} added "${title}" — you owe ₹${split.amount}`,
        metadata: { expenseId, groupId, amount: split.amount },
      },
    });
  }
}
