import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ok, handleError } from "@/lib/api-response";
import { z } from "zod";

const deleteSchema = z.object({
  confirmation: z.literal("DELETE MY ACCOUNT"),
});

// GET /api/user/gdpr — data export (GDPR Article 20)
export async function GET(_req: NextRequest) {
  try {
    const user = await requireAuth();

    const [profile, groups, expenses, settlements, notifications, auditLogs] = await Promise.all([
      db.user.findUnique({
        where: { id: user.id },
        select: {
          id: true, name: true, email: true, phone: true, currency: true,
          plan: true, createdAt: true, referralCode: true,
        },
      }),
      db.groupMember.findMany({
        where: { userId: user.id },
        include: { group: { select: { id: true, name: true, category: true, createdAt: true } } },
      }),
      db.expense.findMany({
        where: { paidById: user.id, isDeleted: false },
        select: { id: true, title: true, amount: true, currency: true, category: true, createdAt: true },
      }),
      db.settlement.findMany({
        where: { OR: [{ fromUserId: user.id }, { toUserId: user.id }] },
        select: { id: true, amount: true, currency: true, status: true, createdAt: true },
      }),
      db.notification.findMany({
        where: { userId: user.id },
        select: { type: true, title: true, body: true, createdAt: true },
        take: 500,
      }),
      db.auditLog.findMany({
        where: { userId: user.id },
        select: { action: true, resource: true, createdAt: true },
        take: 500,
      }),
    ]);

    const export_ = {
      exportedAt: new Date().toISOString(),
      profile,
      groups: groups.map((g) => g.group),
      expenses,
      settlements,
      notifications,
      activityLog: auditLogs,
    };

    await db.auditLog.create({
      data: { userId: user.id, action: "GDPR_EXPORT", resource: "User", resourceId: user.id },
    });

    return ok(export_);
  } catch (err) {
    return handleError(err);
  }
}

// DELETE /api/user/gdpr — account deletion (GDPR Article 17)
export async function DELETE(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    deleteSchema.parse(body);

    // Anonymise rather than hard-delete to preserve group accounting integrity
    await db.user.update({
      where: { id: user.id },
      data: {
        name: "Deleted User",
        email: null,
        phone: null,
        image: null,
        passwordHash: null,
        planStatus: "CANCELLED",
        deletedAt: new Date(),
      },
    });

    await db.auditLog.create({
      data: { userId: user.id, action: "ACCOUNT_DELETED", resource: "User", resourceId: user.id },
    });

    return ok({ deleted: true, message: "Account scheduled for deletion. Data anonymised." });
  } catch (err) {
    return handleError(err);
  }
}
