import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { createGroupSchema, paginationSchema } from "@/lib/validations";
import { ok, created, handleError } from "@/lib/api-response";
import { canUseFeature, isWithinLimit } from "@/lib/services/plan";
import { invalidateCache, getCached, setCached } from "@/lib/redis";
import type { PlanType, PlanStatus } from "@prisma/client";

// GET /api/groups — list user's groups with balances
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const { page, limit, search } = paginationSchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      search: searchParams.get("search"),
    });

    const cacheKey = `groups:${user.id}:${page}:${limit}:${search ?? ""}`;
    const cached = await getCached(cacheKey);
    if (cached) return ok(cached);

    const where = {
      members: { some: { userId: user.id, removedAt: null } },
      isArchived: false,
      ...(search ? { name: { contains: search, mode: "insensitive" as const } } : {}),
    };

    const [groups, total] = await Promise.all([
      db.group.findMany({
        where,
        include: {
          members: {
            where: { removedAt: null },
            include: { user: { select: { id: true, name: true, image: true, reputationScore: true } } },
          },
          _count: { select: { expenses: true } },
        },
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.group.count({ where }),
    ]);

    // Attach my balance to each group
    const result = groups.map((g) => ({
      ...g,
      myBalance: g.members.find((m) => m.userId === user.id)?.balance ?? 0,
      expenseCount: g._count.expenses,
    }));

    await setCached(cacheKey, result, 60);
    return ok(result, { page, limit, total, hasNext: page * limit < total });
  } catch (err) {
    return handleError(err);
  }
}

// POST /api/groups — create a new group
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { plan: true, planStatus: true },
    });
    if (!dbUser) throw new Error("User not found");

    // Plan limit check
    const groupCount = await db.group.count({
      where: { members: { some: { userId: user.id } }, isArchived: false },
    });
    if (!isWithinLimit(dbUser.plan as PlanType, dbUser.planStatus as PlanStatus, "maxGroups", groupCount)) {
      return handleError(
        Object.assign(new Error("Group limit reached. Upgrade to Pro for unlimited groups."), {
          statusCode: 403,
          code: "PLAN_LIMIT_EXCEEDED",
          trigger: "group_limit",
        })
      );
    }

    const body = await req.json();
    const data = createGroupSchema.parse(body);

    const group = await db.group.create({
      data: {
        ...data,
        createdById: user.id,
        members: {
          create: { userId: user.id, role: "OWNER" },
        },
      },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, image: true } } },
        },
      },
    });

    await db.auditLog.create({
      data: { userId: user.id, action: "GROUP_CREATED", resource: "Group", resourceId: group.id },
    });

    await invalidateCache(`groups:${user.id}:*`);
    return created(group);
  } catch (err) {
    return handleError(err);
  }
}
