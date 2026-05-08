import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { signupSchema } from "@/lib/validations";
import { ok, created, handleError } from "@/lib/api-response";
import { authRatelimit } from "@/lib/redis";
import { sendEmail } from "@/lib/services/notification";
import { db as auditDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 10 signups per IP per minute
    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    if (authRatelimit) {
      const { success } = await authRatelimit.limit(`signup:${ip}`);
      if (!success) return handleError(new Error("Too many signup attempts. Try again later."));
    }

    const body = await req.json();
    const data = signupSchema.parse(body);

    // Check duplicate email
    const existing = await db.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return handleError(Object.assign(new Error("Email already in use"), { statusCode: 409 }));
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await db.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        passwordHash,
        plan: "FREE",
        planStatus: "ACTIVE",
        currency: "INR",
      },
      select: { id: true, name: true, email: true, plan: true, createdAt: true },
    });

    // Award first_split badge seed (will exist after prisma seed)
    const badge = await db.badge.findUnique({ where: { slug: "early_adopter" } }).catch(() => null);
    if (badge) {
      await db.userBadge.create({ data: { userId: user.id, badgeId: badge.id } }).catch(() => {});
    }

    // Send welcome email (non-blocking)
    if (user.email) {
      sendEmail(user.email, "welcome", [user.name ?? "there"]).catch(() => {});
    }

    // Audit log
    await auditDb.auditLog.create({
      data: { userId: user.id, action: "USER_CREATED", resource: "User", resourceId: user.id },
    });

    return created(user);
  } catch (err) {
    return handleError(err);
  }
}
