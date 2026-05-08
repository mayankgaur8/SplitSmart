import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { ok, handleError } from "@/lib/api-response";
import { canUseFeature } from "@/lib/services/plan";
import { askGroupFinanceAssistant } from "@/lib/services/ai";
import { db } from "@/lib/db";
import type { PlanType, PlanStatus } from "@prisma/client";
import { z } from "zod";

const schema = z.object({
  question: z.string().min(1).max(500),
  groupId: z.string().cuid().optional(),
});

// POST /api/ai/chat — group finance assistant
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { plan: true, planStatus: true },
    });
    if (!dbUser) throw new Error("User not found");

    if (!canUseFeature(dbUser.plan as PlanType, dbUser.planStatus as PlanStatus, "aiInsights")) {
      return handleError(
        Object.assign(new Error("AI assistant requires Pro plan"), {
          statusCode: 403,
          code: "PLAN_LIMIT_EXCEEDED",
          trigger: "ai_insights",
        })
      );
    }

    const body = await req.json();
    const { question, groupId } = schema.parse(body);

    let chatContext = {
      groupName: "your group",
      totalSpent: 0,
      memberCount: 0,
      pendingSettlements: 0,
    };

    if (groupId) {
      const member = await db.groupMember.findFirst({
        where: { groupId, userId: user.id, removedAt: null },
      });
      if (!member) throw Object.assign(new Error("Not a member of this group"), { statusCode: 403 });

      const [group, recentExpenses, pendingCount] = await Promise.all([
        db.group.findUnique({
          where: { id: groupId },
          include: { members: { where: { removedAt: null } } },
        }),
        db.expense.findMany({
          where: { groupId, isDeleted: false },
          orderBy: { createdAt: "desc" },
          take: 20,
          select: { amount: true },
        }),
        db.settlement.count({ where: { groupId, status: "PENDING" } }),
      ]);

      if (group) {
        chatContext = {
          groupName: group.name,
          totalSpent: recentExpenses.reduce((sum, e) => sum + e.amount, 0),
          memberCount: group.members.length,
          pendingSettlements: pendingCount,
        };
      }
    }

    const answer = await askGroupFinanceAssistant(question, chatContext);
    return ok({ answer });
  } catch (err) {
    return handleError(err);
  }
}
