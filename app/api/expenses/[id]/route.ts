import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { updateExpenseSchema } from "@/lib/validations";
import { ok, handleError } from "@/lib/api-response";
import { invalidateCache } from "@/lib/redis";

type Params = { params: Promise<{ id: string }> };

async function getExpenseOrThrow(id: string) {
  const expense = await db.expense.findUnique({
    where: { id },
    include: {
      paidBy: { select: { id: true, name: true, image: true } },
      group: { select: { id: true, name: true, currency: true } },
      splits: { include: { user: { select: { id: true, name: true, image: true } } } },
    },
  });
  if (!expense || expense.isDeleted) {
    throw Object.assign(new Error("Expense not found"), { statusCode: 404 });
  }
  return expense;
}

// GET /api/expenses/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const expense = await getExpenseOrThrow(id);

    // Check group membership
    const member = await db.groupMember.findFirst({
      where: { groupId: expense.groupId, userId: user.id, removedAt: null },
    });
    if (!member) throw Object.assign(new Error("Access denied"), { statusCode: 403 });

    return ok(expense);
  } catch (err) {
    return handleError(err);
  }
}

// PATCH /api/expenses/[id] — update (creator or group admin only)
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const expense = await getExpenseOrThrow(id);

    const member = await db.groupMember.findFirst({
      where: { groupId: expense.groupId, userId: user.id, removedAt: null },
    });
    if (!member) throw Object.assign(new Error("Access denied"), { statusCode: 403 });
    if (expense.createdById !== user.id && member.role !== "OWNER" && member.role !== "ADMIN") {
      throw Object.assign(new Error("Only the creator or group admin can edit this expense"), { statusCode: 403 });
    }

    const body = await req.json();
    const data = updateExpenseSchema.parse(body);

    const updated = await db.expense.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.amount && { amount: data.amount }),
        ...(data.category && { category: data.category }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.tags && { tags: data.tags }),
      },
      include: {
        paidBy: { select: { id: true, name: true, image: true } },
        splits: { include: { user: { select: { id: true, name: true } } } },
      },
    });

    await db.auditLog.create({
      data: { userId: user.id, action: "EXPENSE_UPDATED", resource: "Expense", resourceId: id },
    });

    await invalidateCache(`expenses:${user.id}:*`);
    return ok(updated);
  } catch (err) {
    return handleError(err);
  }
}

// DELETE /api/expenses/[id] — soft delete
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const expense = await getExpenseOrThrow(id);

    const member = await db.groupMember.findFirst({
      where: { groupId: expense.groupId, userId: user.id, removedAt: null },
    });
    if (!member) throw Object.assign(new Error("Access denied"), { statusCode: 403 });
    if (expense.createdById !== user.id && member.role !== "OWNER" && member.role !== "ADMIN") {
      throw Object.assign(new Error("Only the creator or group admin can delete this expense"), { statusCode: 403 });
    }

    await db.expense.update({ where: { id }, data: { isDeleted: true } });

    // Reverse balance changes
    for (const split of expense.splits) {
      if (split.userId === expense.paidById) continue;
      await db.groupMember.updateMany({
        where: { groupId: expense.groupId, userId: expense.paidById },
        data: { balance: { decrement: split.amount } },
      });
      await db.groupMember.updateMany({
        where: { groupId: expense.groupId, userId: split.userId },
        data: { balance: { increment: split.amount } },
      });
    }

    await db.auditLog.create({
      data: { userId: user.id, action: "EXPENSE_DELETED", resource: "Expense", resourceId: id },
    });

    await invalidateCache(`expenses:${user.id}:*`);
    return ok({ deleted: true });
  } catch (err) {
    return handleError(err);
  }
}
