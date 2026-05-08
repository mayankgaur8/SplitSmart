import { db } from "@/lib/db";

export type RevenueEvent =
  | "signup_started"
  | "signup_completed"
  | "group_created"
  | "expense_created"
  | "settlement_started"
  | "settlement_completed"
  | "upgrade_viewed"
  | "upgrade_started"
  | "upgrade_completed"
  | "coupon_applied"
  | "referral_invited"
  | "churn_started"
  | "churn_completed";

export async function trackRevenueEvent(
  userId: string | null,
  event: RevenueEvent,
  metadata: Record<string, unknown> = {}
) {
  await db.auditLog.create({
    data: {
      userId,
      action: event.startsWith("upgrade") ? "PLAN_UPGRADED" : "USER_UPDATED",
      resource: "RevenueEvent",
      metadata: { event, ...metadata },
    },
  }).catch(() => {});
}

export function getPricingExperiment(userId: string): "control" | "annual_discount" | "team_trial" {
  const bucket = userId.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) % 3;
  return bucket === 0 ? "annual_discount" : bucket === 1 ? "team_trial" : "control";
}

export function buildOnboardingChecklist(state: {
  hasGroup: boolean;
  hasExpense: boolean;
  hasInvite: boolean;
  hasSettlement: boolean;
}) {
  return [
    { id: "create_group", complete: state.hasGroup },
    { id: "invite_member", complete: state.hasInvite },
    { id: "add_expense", complete: state.hasExpense },
    { id: "settle_balance", complete: state.hasSettlement },
  ];
}
