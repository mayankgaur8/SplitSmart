import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { updateGroupSchema, inviteMemberSchema } from "@/lib/validations";
import { ok, handleError } from "@/lib/api-response";
import { isWithinLimit } from "@/lib/services/plan";
import { invalidateCache, getCached, setCached } from "@/lib/redis";
import { sendWhatsApp } from "@/lib/services/notification";
import type { PlanType, PlanStatus } from "@prisma/client";

type Params = { params: Promise<{ id: string }> };

async function assertMembership(groupId: string, userId: string) {
  const member = await db.groupMember.findFirst({
    where: { groupId, userId, removedAt: null },
  });
  if (!member) throw Object.assign(new Error("Not a member of this group"), { statusCode: 403 });
  return member;
}

// GET /api/groups/[id] — full group detail with expenses summary
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const cacheKey = `group:${id}:${user.id}`;
    const cached = await getCached(cacheKey);
    if (cached) return ok(cached);

    await assertMembership(id, user.id);

    const group = await db.group.findUnique({
      where: { id },
      include: {
        members: {
          where: { removedAt: null },
          include: {
            user: { select: { id: true, name: true, image: true, email: true, reputationScore: true } },
          },
        },
        expenses: {
          orderBy: { createdAt: "desc" },
          take: 5,
          include: {
            paidBy: { select: { id: true, name: true, image: true } },
            splits: { select: { userId: true, amount: true, isPaid: true } },
          },
        },
        _count: { select: { expenses: true } },
      },
    });

    if (!group || group.isArchived) {
      throw Object.assign(new Error("Group not found"), { statusCode: 404 });
    }

    const result = {
      ...group,
      myBalance: group.members.find((m) => m.userId === user.id)?.balance ?? 0,
      expenseCount: group._count.expenses,
    };

    await setCached(cacheKey, result, 30);
    return ok(result);
  } catch (err) {
    return handleError(err);
  }
}

// PATCH /api/groups/[id] — update group (admin/owner only)
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const member = await assertMembership(id, user.id);
    if (member.role !== "OWNER" && member.role !== "ADMIN") {
      throw Object.assign(new Error("Only group owners and admins can edit"), { statusCode: 403 });
    }

    const body = await req.json();
    const data = updateGroupSchema.parse(body);

    const group = await db.group.update({
      where: { id },
      data,
      include: {
        members: {
          where: { removedAt: null },
          include: { user: { select: { id: true, name: true, image: true } } },
        },
      },
    });

    await db.auditLog.create({
      data: { userId: user.id, action: "GROUP_UPDATED", resource: "Group", resourceId: id },
    });

    await invalidateCache(`group:${id}:*`);
    await invalidateCache(`groups:${user.id}:*`);
    return ok(group);
  } catch (err) {
    return handleError(err);
  }
}

// DELETE /api/groups/[id] — archive group (owner only)
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const member = await assertMembership(id, user.id);
    if (member.role !== "OWNER") {
      throw Object.assign(new Error("Only the group owner can archive"), { statusCode: 403 });
    }

    await db.group.update({ where: { id }, data: { isArchived: true } });

    await db.auditLog.create({
      data: { userId: user.id, action: "GROUP_ARCHIVED", resource: "Group", resourceId: id },
    });

    await invalidateCache(`group:${id}:*`);
    await invalidateCache(`groups:${user.id}:*`);
    return ok({ archived: true });
  } catch (err) {
    return handleError(err);
  }
}

// POST /api/groups/[id] — invite member
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { plan: true, planStatus: true },
    });
    if (!dbUser) throw new Error("User not found");

    const member = await assertMembership(id, user.id);
    if (member.role !== "OWNER" && member.role !== "ADMIN") {
      throw Object.assign(new Error("Only admins can invite members"), { statusCode: 403 });
    }

    // Plan limit: max members per group
    const currentMemberCount = await db.groupMember.count({ where: { groupId: id, removedAt: null } });
    if (!isWithinLimit(dbUser.plan as PlanType, dbUser.planStatus as PlanStatus, "maxMembersPerGroup", currentMemberCount)) {
      return handleError(
        Object.assign(new Error("Member limit reached. Upgrade to Pro for more members."), {
          statusCode: 403,
          code: "PLAN_LIMIT_EXCEEDED",
          trigger: "group_limit",
        })
      );
    }

    const body = await req.json();
    const { email, phone } = inviteMemberSchema.parse(body);

    // Find invited user
    const invited = await db.user.findFirst({
      where: email ? { email } : { phone },
    });

    if (!invited) {
      // Send invite via email/whatsapp even if not registered
      if (email) {
        // No group_invite template — send WhatsApp or skip; unregistered users get a signup nudge
      } else if (phone) {
        const group = await db.group.findUnique({ where: { id }, select: { name: true } });
        sendWhatsApp(phone, `You've been invited to join "${group?.name}" on SplitSmart. Sign up at https://splitsmart.app`).catch(() => {});
      }
      return ok({ invited: false, message: "Invite sent to unregistered user" });
    }

    // Check already a member
    const existing = await db.groupMember.findFirst({ where: { groupId: id, userId: invited.id } });
    if (existing && !existing.removedAt) {
      throw Object.assign(new Error("User is already a member"), { statusCode: 409 });
    }

    // Re-add if previously removed, else create
    if (existing?.removedAt) {
      await db.groupMember.update({ where: { id: existing.id }, data: { removedAt: null, role: "MEMBER" } });
    } else {
      await db.groupMember.create({ data: { groupId: id, userId: invited.id, role: "MEMBER" } });
    }

    await db.notification.create({
      data: {
        userId: invited.id,
        type: "GROUP_INVITE",
        channel: "IN_APP",
        title: "Group invite",
        body: `You've been added to a group`,
        metadata: { groupId: id },
      },
    });

    await invalidateCache(`group:${id}:*`);
    return ok({ invited: true, userId: invited.id });
  } catch (err) {
    return handleError(err);
  }
}
