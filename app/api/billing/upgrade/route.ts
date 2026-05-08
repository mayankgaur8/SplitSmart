import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { ok, handleError } from "@/lib/api-response";
import { upgradePlanSchema } from "@/lib/validations";
import { createPlanOrder } from "@/lib/services/payment";

// POST /api/billing/upgrade — create payment order for plan upgrade
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { plan, gateway } = upgradePlanSchema.parse(body);

    const order = await createPlanOrder(user.id, plan, "INR", gateway);
    return ok(order);
  } catch (err) {
    return handleError(err);
  }
}
