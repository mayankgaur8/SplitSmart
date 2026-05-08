import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { ok, handleError } from "@/lib/api-response";
import { canUseFeature } from "@/lib/services/plan";
import { categorizeExpense } from "@/lib/services/ai";
import { db } from "@/lib/db";
import type { PlanType, PlanStatus } from "@prisma/client";
import { z } from "zod";

const schema = z.object({ title: z.string().min(1).max(200) });

// POST /api/ai/categorize
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
        Object.assign(new Error("AI features require Pro plan"), {
          statusCode: 403,
          code: "PLAN_LIMIT_EXCEEDED",
          trigger: "ai_insights",
        })
      );
    }

    const body = await req.json();
    const { title } = schema.parse(body);

    const category = await categorizeExpense(title, 0);
    return ok({ category: category ?? "OTHER" });
  } catch (err) {
    return handleError(err);
  }
}
