import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ok, handleError } from "@/lib/api-response";
import { z } from "zod";
import bcrypt from "bcryptjs";

const updateProfileSchema = z.object({
  name: z.string().min(2).max(60).optional(),
  currency: z.string().length(3).optional(),
  image: z.string().url().optional(),
  currentPassword: z.string().optional(),
  newPassword: z
    .string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[0-9]/)
    .optional(),
});

// GET /api/user/profile
export async function GET(_req: NextRequest) {
  try {
    const user = await requireAuth();
    const profile = await db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        currency: true,
        plan: true,
        planStatus: true,
        planExpiresAt: true,
        reputationScore: true,
        paymentStreak: true,
        longestStreak: true,
        totalPaid: true,
        referralCode: true,
        createdAt: true,
        userBadges: { include: { badge: true } },
      },
    });
    if (!profile) throw new Error("User not found");
    return ok(profile);
  } catch (err) {
    return handleError(err);
  }
}

// PATCH /api/user/profile
export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const data = updateProfileSchema.parse(body);

    // Password change
    if (data.newPassword) {
      if (!data.currentPassword) {
        throw Object.assign(new Error("Current password required to change password"), { statusCode: 400 });
      }
      const dbUser = await db.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } });
      if (!dbUser?.passwordHash) {
        throw Object.assign(new Error("No password set — use social login"), { statusCode: 400 });
      }
      const valid = await bcrypt.compare(data.currentPassword, dbUser.passwordHash);
      if (!valid) throw Object.assign(new Error("Current password incorrect"), { statusCode: 400 });
    }

    const updated = await db.user.update({
      where: { id: user.id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.currency && { currency: data.currency }),
        ...(data.image && { image: data.image }),
        ...(data.newPassword && { passwordHash: await bcrypt.hash(data.newPassword, 12) }),
      },
      select: { id: true, name: true, email: true, currency: true, image: true },
    });

    return ok(updated);
  } catch (err) {
    return handleError(err);
  }
}
