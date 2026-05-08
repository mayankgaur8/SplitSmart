import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ok, handleError } from "@/lib/api-response";
import { paginationSchema } from "@/lib/validations";

// GET /api/notifications
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get("unread") === "true";
    const { page, limit } = paginationSchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
    });

    const where = {
      userId: user.id,
      ...(unreadOnly ? { isRead: false } : {}),
    };

    const [notifications, total, unreadCount] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.notification.count({ where }),
      db.notification.count({ where: { userId: user.id, isRead: false } }),
    ]);

    return ok({ notifications, unreadCount }, { page, limit, total, hasNext: page * limit < total });
  } catch (err) {
    return handleError(err);
  }
}

// PATCH /api/notifications — mark read (bulk or single)
export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { ids, markAll } = body as { ids?: string[]; markAll?: boolean };

    if (markAll) {
      await db.notification.updateMany({
        where: { userId: user.id, isRead: false },
        data: { isRead: true },
      });
    } else if (ids?.length) {
      await db.notification.updateMany({
        where: { id: { in: ids }, userId: user.id },
        data: { isRead: true },
      });
    }

    return ok({ updated: true });
  } catch (err) {
    return handleError(err);
  }
}
