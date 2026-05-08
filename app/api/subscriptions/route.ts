import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { createSubscriptionSchema, paginationSchema } from "@/lib/validations";
import { ok, created, handleError } from "@/lib/api-response";
import { isWithinLimit } from "@/lib/services/plan";
import { invalidateCache, getCached, setCached } from "@/lib/redis";
import type { PlanType, PlanStatus } from "@prisma/client";

// GET /api/subscriptions
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get("groupId");
    const { page, limit } = paginationSchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
    });

    const cacheKey = `subs:${user.id}:${groupId ?? "all"}:${page}:${limit}`;
    const cached = await getCached(cacheKey);
    if (cached) return ok(cached);

    let where: Record<string, unknown>;
    if (groupId) {
      const member = await db.groupMember.findFirst({
        where: { groupId, userId: user.id, removedAt: null },
      });
      if (!member) throw Object.assign(new Error("Not a member"), { statusCode: 403 });
      where = { groupSubscriptions: { some: { groupId } } };
    } else {
      where = { userId: user.id };
    }

    const [subs, total] = await Promise.all([
      db.subscription.findMany({
        where,
        include: {
          groupSubscriptions: { include: { group: { select: { id: true, name: true } } } },
        },
        orderBy: { renewalDate: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.subscription.count({ where }),
    ]);

    await setCached(cacheKey, subs, 60);
    return ok(subs, { page, limit, total, hasNext: page * limit < total });
  } catch (err) {
    return handleError(err);
  }
}

// POST /api/subscriptions
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { plan: true, planStatus: true },
    });
    if (!dbUser) throw new Error("User not found");

    const subCount = await db.subscription.count({ where: { userId: user.id } });
    if (!isWithinLimit(dbUser.plan as PlanType, dbUser.planStatus as PlanStatus, "maxSubscriptions", subCount)) {
      return handleError(
        Object.assign(new Error("Subscription limit reached. Upgrade to Pro for unlimited subscriptions."), {
          statusCode: 403,
          code: "PLAN_LIMIT_EXCEEDED",
          trigger: "group_limit",
        })
      );
    }

    const body = await req.json();
    const data = createSubscriptionSchema.parse(body);

    const sub = await db.subscription.create({
      data: {
        userId: user.id,
        name: data.name,
        logo: data.logo,
        color: data.color,
        category: data.category,
        monthlyCost: data.monthlyCost,
        currency: data.currency,
        billingCycle: data.billingCycle,
        renewalDate: new Date(data.renewalDate),
        autoRenew: data.autoRenew,
        ...(data.groupId && {
          groupSubscriptions: {
            create: { groupId: data.groupId },
          },
        }),
      },
      include: {
        groupSubscriptions: { include: { group: { select: { id: true, name: true } } } },
      },
    });

    await db.auditLog.create({
      data: { userId: user.id, action: "SUBSCRIPTION_CREATED", resource: "Subscription", resourceId: sub.id },
    });

    await invalidateCache(`subs:${user.id}:*`);
    return created(sub);
  } catch (err) {
    return handleError(err);
  }
}
