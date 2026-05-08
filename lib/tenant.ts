import { db } from "@/lib/db";

export async function requireGroupMember(userId: string, groupId: string) {
  const member = await db.groupMember.findFirst({
    where: { userId, groupId, removedAt: null },
  });
  if (!member) throw Object.assign(new Error("Not a member of this group"), { statusCode: 403 });
  return member;
}

export async function requireExpenseAccess(userId: string, expenseId: string) {
  const expense = await db.expense.findFirst({
    where: {
      id: expenseId,
      isDeleted: false,
      group: { members: { some: { userId, removedAt: null } } },
    },
  });
  if (!expense) throw Object.assign(new Error("Expense not found"), { statusCode: 404 });
  return expense;
}

export async function requireSettlementAccess(userId: string, settlementId: string) {
  const settlement = await db.settlement.findFirst({
    where: { id: settlementId, OR: [{ fromUserId: userId }, { toUserId: userId }] },
  });
  if (!settlement) throw Object.assign(new Error("Settlement not found"), { statusCode: 404 });
  return settlement;
}

export async function requireSubscriptionAccess(userId: string, subscriptionId: string) {
  const subscription = await db.subscription.findFirst({ where: { id: subscriptionId, userId } });
  if (!subscription) throw Object.assign(new Error("Subscription not found"), { statusCode: 404 });
  return subscription;
}
