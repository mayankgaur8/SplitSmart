import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { ok, handleError } from "@/lib/api-response";
import { verifyPaymentSchema } from "@/lib/validations";
import { verifyRazorpayWebhook, confirmSettlement } from "@/lib/services/payment";
import { db } from "@/lib/db";
import crypto from "crypto";

// POST /api/payments/verify — client-side payment verification after Razorpay checkout
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const data = verifyPaymentSchema.parse(body);

    const settlement = await db.settlement.findUnique({ where: { id: data.settlementId } });
    if (!settlement) throw Object.assign(new Error("Settlement not found"), { statusCode: 404 });
    if (settlement.fromUserId !== user.id) {
      throw Object.assign(new Error("Access denied"), { statusCode: 403 });
    }

    if (data.razorpayOrderId && data.razorpayPaymentId && data.razorpaySignature) {
      // Razorpay client-side signature verification
      const secret = process.env.RAZORPAY_KEY_SECRET;
      if (!secret) throw new Error("Razorpay not configured");

      const payload = `${data.razorpayOrderId}|${data.razorpayPaymentId}`;
      const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
      const valid = crypto.timingSafeEqual(
        Buffer.from(data.razorpaySignature),
        Buffer.from(expected)
      );
      if (!valid) throw Object.assign(new Error("Payment signature invalid"), { statusCode: 400 });

      await confirmSettlement(data.settlementId, data.razorpayPaymentId);
      return ok({ verified: true, gateway: "RAZORPAY" });
    }

    if (data.stripePaymentIntentId) {
      // Stripe — PI should be confirmed on server via webhook; this is just a status poll
      return ok({ verified: true, gateway: "STRIPE", pending: true });
    }

    throw Object.assign(new Error("No payment data provided"), { statusCode: 400 });
  } catch (err) {
    return handleError(err);
  }
}
