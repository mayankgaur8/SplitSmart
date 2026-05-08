import type { PlanType, PlanStatus } from "@prisma/client";

// ─── Plan limits config ───────────────────────────────────────────────────────

export const PLAN_LIMITS = {
  FREE: {
    maxGroups: 3,
    maxMembersPerGroup: 5,
    maxExpensesPerMonth: 30,
    maxSubscriptions: 5,
    aiInsights: false,
    receiptOcr: false,
    whatsappReminders: false,
    advancedAnalytics: false,
    exportReports: false,
    prioritySupport: false,
    customCategories: false,
    expenseApprovals: false,
    adminControls: false,
  },
  PRO: {
    maxGroups: Infinity,
    maxMembersPerGroup: 50,
    maxExpensesPerMonth: Infinity,
    maxSubscriptions: Infinity,
    aiInsights: true,
    receiptOcr: true,
    whatsappReminders: true,
    advancedAnalytics: true,
    exportReports: false,
    prioritySupport: true,
    customCategories: true,
    expenseApprovals: false,
    adminControls: false,
  },
  TEAM: {
    maxGroups: Infinity,
    maxMembersPerGroup: Infinity,
    maxExpensesPerMonth: Infinity,
    maxSubscriptions: Infinity,
    aiInsights: true,
    receiptOcr: true,
    whatsappReminders: true,
    advancedAnalytics: true,
    exportReports: true,
    prioritySupport: true,
    customCategories: true,
    expenseApprovals: true,
    adminControls: true,
  },
} as const;

export type PlanFeature = keyof (typeof PLAN_LIMITS)["FREE"];

// ─── Pricing ──────────────────────────────────────────────────────────────────

export const PLAN_PRICING = {
  FREE: { INR: 0, USD: 0 },
  PRO: { INR: 299, USD: 5 },
  TEAM: { INR: 999, USD: 14 },
} as const;

// ─── Guard functions ──────────────────────────────────────────────────────────

export function canUseFeature(
  plan: PlanType,
  planStatus: PlanStatus,
  feature: PlanFeature
): boolean {
  // Grace period: still has access for 3 days after expiry
  if (planStatus === "CANCELLED" || planStatus === "EXPIRED") {
    // Downgrade to FREE limits
    return PLAN_LIMITS["FREE"][feature] as boolean;
  }
  return PLAN_LIMITS[plan][feature] as boolean;
}

export function getLimit(
  plan: PlanType,
  planStatus: PlanStatus,
  limit: "maxGroups" | "maxMembersPerGroup" | "maxExpensesPerMonth" | "maxSubscriptions"
): number {
  if (planStatus === "CANCELLED" || planStatus === "EXPIRED") {
    return PLAN_LIMITS["FREE"][limit];
  }
  return PLAN_LIMITS[plan][limit];
}

export function isWithinLimit(
  plan: PlanType,
  planStatus: PlanStatus,
  limit: "maxGroups" | "maxMembersPerGroup" | "maxExpensesPerMonth" | "maxSubscriptions",
  current: number
): boolean {
  const max = getLimit(plan, planStatus, limit);
  return current < max;
}

// ─── Upgrade prompt triggers ──────────────────────────────────────────────────

export type UpgradeTrigger =
  | "group_limit"
  | "expense_limit"
  | "ai_insights"
  | "receipt_ocr"
  | "whatsapp_reminders"
  | "advanced_analytics"
  | "export_reports"
  | "expense_approvals"
  | "admin_controls";

export const UPGRADE_MESSAGES: Record<UpgradeTrigger, { title: string; body: string; cta: string }> = {
  group_limit: {
    title: "Group limit reached",
    body: "Free plan allows up to 3 groups. Upgrade to Pro for unlimited groups.",
    cta: "Upgrade to Pro — ₹299/month",
  },
  expense_limit: {
    title: "Expense limit reached",
    body: "You've hit the 30 expense/month limit. Upgrade for unlimited tracking.",
    cta: "Upgrade to Pro",
  },
  ai_insights: {
    title: "AI Insights is a Pro feature",
    body: "Get personalized spending analysis, subscription waste detection, and saving tips.",
    cta: "Unlock AI Insights",
  },
  receipt_ocr: {
    title: "Receipt scanning is a Pro feature",
    body: "Snap a receipt and AI auto-fills amount, merchant, and category.",
    cta: "Upgrade to Pro",
  },
  whatsapp_reminders: {
    title: "WhatsApp reminders are Pro-only",
    body: "Send friendly payment nudges via WhatsApp to keep your group on track.",
    cta: "Enable WhatsApp Reminders",
  },
  advanced_analytics: {
    title: "Advanced analytics is a Pro feature",
    body: "Deep-dive into spending patterns, trends, and category breakdowns.",
    cta: "Upgrade to Pro",
  },
  export_reports: {
    title: "CSV/PDF export is a Team feature",
    body: "Export expense reports for your team or accountant.",
    cta: "Upgrade to Team — ₹999/month",
  },
  expense_approvals: {
    title: "Expense approvals are a Team feature",
    body: "Require admin approval before expenses are finalized.",
    cta: "Upgrade to Team",
  },
  admin_controls: {
    title: "Admin controls are a Team feature",
    body: "Manage your team, set budgets, and control permissions.",
    cta: "Upgrade to Team",
  },
};
