import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { ok, handleError } from "@/lib/api-response";
import { adminUserUpdateSchema } from "@/lib/validations";
import type { UserRole, PlanType, PlanStatus } from "@prisma/client";

type Params = { params: Promise<{ id: string }> };

// GET /api/admin/users/[id] — full user detail for admin
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await requireRole("SUPER_ADMIN");
    const { id } = await params;

    const user = await db.user.findUnique({
      where: { id },
      include: {
        groupMemberships: { include: { group: { select: { id: true, name: true } } } },
        auditLogs: { orderBy: { createdAt: "desc" }, take: 20 },
        invoices: { orderBy: { createdAt: "desc" }, take: 12 },
        userBadges: { include: { badge: true } },
      },
    });

    if (!user) throw Object.assign(new Error("User not found"), { statusCode: 404 });
    return ok(user);
  } catch (err) {
    return handleError(err);
  }
}

// PATCH /api/admin/users/[id] — update role, plan, planStatus (admin override)
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireRole("SUPER_ADMIN");
    const { id } = await params;

    const body = await req.json();
    const data = adminUserUpdateSchema.parse(body);

    const updated = await db.user.update({
      where: { id },
      data: {
        ...(data.role && { role: data.role as UserRole }),
        ...(data.plan && { plan: data.plan as PlanType }),
        ...(data.planStatus && { planStatus: data.planStatus as PlanStatus }),
      },
      select: { id: true, name: true, email: true, role: true, plan: true, planStatus: true },
    });

    await db.auditLog.create({
      data: {
        userId: admin.id,
        action: "ADMIN_USER_UPDATE",
        resource: "User",
        resourceId: id,
        metadata: data,
      },
    });

    return ok(updated);
  } catch (err) {
    return handleError(err);
  }
}
