import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { otpRequestSchema, otpVerifySchema } from "@/lib/validations";
import { ok, handleError } from "@/lib/api-response";
import { authRatelimit } from "@/lib/redis";
import { sendWhatsApp } from "@/lib/services/notification";

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /api/auth/otp — request OTP
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    if (authRatelimit) {
      const { success } = await authRatelimit.limit(`otp:${ip}`);
      if (!success) return handleError(new Error("Too many OTP requests"));
    }

    const body = await req.json();
    const { action } = body;

    if (action === "request") {
      const { phone } = otpRequestSchema.parse(body);
      const code = generateOtp();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

      // Invalidate old codes
      await db.otpCode.updateMany({
        where: { phone, used: false },
        data: { used: true },
      });

      await db.otpCode.create({ data: { phone, code, expiresAt } });

      // Send via WhatsApp (or SMS fallback)
      await sendWhatsApp(phone, `Your SplitSmart OTP is: *${code}*\nValid for 10 minutes. Do not share.`);

      return ok({ sent: true, phone });
    }

    if (action === "verify") {
      const { phone, code } = otpVerifySchema.parse(body);
      const record = await db.otpCode.findFirst({
        where: { phone, code, used: false, expiresAt: { gte: new Date() } },
        orderBy: { createdAt: "desc" },
      });

      if (!record) return handleError(Object.assign(new Error("Invalid or expired OTP"), { statusCode: 400 }));

      await db.otpCode.update({ where: { id: record.id }, data: { used: true } });

      // Find or create user by phone
      let user = await db.user.findUnique({ where: { phone } });
      if (!user) {
        user = await db.user.create({
          data: { phone, plan: "FREE", planStatus: "ACTIVE", currency: "INR" },
        });
      }

      return ok({ verified: true, userId: user.id, isNewUser: !user.emailVerified });
    }

    return handleError(new Error("Invalid action"));
  } catch (err) {
    return handleError(err);
  }
}
