import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { createSettlementSchema, paginationSchema } from "@/lib/validations";
import { ok, created, handleError } from "@/lib/api-response";
import { getCached, setCached, invalidateCache } from "@/lib/redis";
import { requireGroupMember } from "@/lib/tenant";

// GET /api/settlements — list settlements (sent or received)
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const direction = searchParams.get("direction") ?? "all"; // "sent" | "received" | "all"
    const status = searchParams.get("status"); // "PENDING" | "COMPLETED" | etc.
    const groupId = searchParams.get("groupId");
    const { page, limit } = paginationSchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
    });

    const cacheKey = `settlements:${user.id}:${direction}:${status ?? ""}:${groupId ?? ""}:${page}:${limit}`;
    const cached = await getCached(cacheKey);
    if (cached) return ok(cached);

    if (groupId) {
      await requireGroupMember(user.id, groupId);
    }

    const where: Record<string, unknown> = {
      ...(direction === "sent" ? { fromUserId: user.id } : {}),
      ...(direction === "received" ? { toUserId: user.id } : {}),
      ...(direction === "all" ? { OR: [{ fromUserId: user.id }, { toUserId: user.id }] } : {}),
      ...(status ? { status } : {}),
      ...(groupId ? { groupId } : {}),
    };

    const [settlements, total] = await Promise.all([
      db.settlement.findMany({
        where,
        include: {
          fromUser: { select: { id: true, name: true, image: true } },
          toUser: { select: { id: true, name: true, image: true } },
          group: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.settlement.count({ where }),
    ]);

    await setCached(cacheKey, settlements, 30);
    return ok(settlements, { page, limit, total, hasNext: page * limit < total });
  } catch (err) {
    return handleError(err);
  }
}

// POST /api/settlements — initiate a settlement
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const data = createSettlementSchema.parse(body);

    if (data.toUserId === user.id) {
      throw Object.assign(new Error("Cannot settle with yourself"), { statusCode: 400 });
    }

    if (data.groupId) {
      await requireGroupMember(user.id, data.groupId);
      await requireGroupMember(data.toUserId, data.groupId);
    }

    const settlement = await db.settlement.create({
      data: {
        fromUserId: user.id,
        toUserId: data.toUserId,
        amount: data.amount,
        currency: data.currency,
        groupId: data.groupId,
        note: data.note,
        method: data.method,
        gateway: data.gateway,
        status: "PENDING",
      },
      include: {
        fromUser: { select: { id: true, name: true, image: true } },
        toUser: { select: { id: true, name: true, image: true } },
      },
    });

    // Notify recipient
    await db.notification.create({
      data: {
        userId: data.toUserId,
        type: "PAYMENT_DUE",
        channel: "IN_APP",
        title: "Payment request",
        body: `${settlement.fromUser.name} wants to settle ₹${data.amount} with you`,
        metadata: { settlementId: settlement.id },
      },
    });

    await db.auditLog.create({
      data: { userId: user.id, action: "SETTLEMENT_CREATED", resource: "Settlement", resourceId: settlement.id },
    });

    await invalidateCache(`settlements:${user.id}:*`);
    return created(settlement);
  } catch (err) {
    return handleError(err);
  }
}
