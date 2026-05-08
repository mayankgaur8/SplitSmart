import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ok, handleError } from "@/lib/api-response";
import { invalidateCache } from "@/lib/redis";

type Params = { params: Promise<{ id: string }> };

// GET /api/settlements/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const settlement = await db.settlement.findUnique({
      where: { id },
      include: {
        fromUser: { select: { id: true, name: true, image: true } },
        toUser: { select: { id: true, name: true, image: true } },
        group: { select: { id: true, name: true } },
      },
    });

    if (!settlement) throw Object.assign(new Error("Settlement not found"), { statusCode: 404 });
    if (settlement.fromUserId !== user.id && settlement.toUserId !== user.id) {
      throw Object.assign(new Error("Access denied"), { statusCode: 403 });
    }

    return ok(settlement);
  } catch (err) {
    return handleError(err);
  }
}

// PATCH /api/settlements/[id] — mark as disputed or cancelled (by parties)
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await req.json();

    const settlement = await db.settlement.findUnique({ where: { id } });
    if (!settlement) throw Object.assign(new Error("Settlement not found"), { statusCode: 404 });
    if (settlement.fromUserId !== user.id && settlement.toUserId !== user.id) {
      throw Object.assign(new Error("Access denied"), { statusCode: 403 });
    }

    const { status, note } = body as { status?: string; note?: string };
    const allowed: Array<"DISPUTED" | "FAILED"> = ["DISPUTED", "FAILED"];
    if (status && !allowed.includes(status as "DISPUTED" | "FAILED")) {
      throw Object.assign(new Error("Invalid status transition"), { statusCode: 400 });
    }

    const updated = await db.settlement.update({
      where: { id },
      data: {
        ...(status ? { status: status as "DISPUTED" | "FAILED" } : {}),
        ...(note !== undefined ? { note } : {}),
      },
    });

    await db.auditLog.create({
      data: { userId: user.id, action: "SETTLEMENT_UPDATED", resource: "Settlement", resourceId: id },
    });

    await invalidateCache(`settlements:${user.id}:*`);
    return ok(updated);
  } catch (err) {
    return handleError(err);
  }
}
