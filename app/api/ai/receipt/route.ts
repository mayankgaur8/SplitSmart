import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { ok, handleError } from "@/lib/api-response";
import { canUseFeature } from "@/lib/services/plan";
import { parseReceiptText } from "@/lib/services/ai";
import { db } from "@/lib/db";
import type { PlanType, PlanStatus } from "@prisma/client";
import { z } from "zod";

const schema = z.object({
  text: z.string().min(1).max(5000),
});

// POST /api/ai/receipt — parse OCR text from a receipt
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { plan: true, planStatus: true },
    });
    if (!dbUser) throw new Error("User not found");

    if (!canUseFeature(dbUser.plan as PlanType, dbUser.planStatus as PlanStatus, "receiptOcr")) {
      return handleError(
        Object.assign(new Error("Receipt OCR requires Pro plan"), {
          statusCode: 403,
          code: "PLAN_LIMIT_EXCEEDED",
          trigger: "receipt_ocr",
        })
      );
    }

    const body = await req.json();
    const { text } = schema.parse(body);
    const parsed = await parseReceiptText(text);

    if (!parsed) {
      return ok({ parsed: null, message: "Could not extract data from receipt" });
    }

    return ok({ parsed });
  } catch (err) {
    return handleError(err);
  }
}
