import { z } from "zod";

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(60),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[0-9]/, "Must contain a number"),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{9,14}$/, "Invalid phone number")
    .optional(),
  referralCode: z.string().max(20).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password required"),
});

export const otpRequestSchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{9,14}$/, "Invalid phone number"),
});

export const otpVerifySchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{9,14}$/),
  code: z.string().length(6, "OTP must be 6 digits").regex(/^\d+$/),
});

export const passwordResetSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
});

// ─── Groups ──────────────────────────────────────────────────────────────────

export const createGroupSchema = z.object({
  name: z.string().min(2, "Name too short").max(80),
  description: z.string().max(300).optional(),
  category: z.enum([
    "FLATMATES", "TRAVEL", "FRIENDS", "COUPLE", "FAMILY",
    "TEAM", "SUBSCRIPTIONS", "OTHER",
  ]),
  currency: z.string().length(3).default("INR"),
});

export const updateGroupSchema = createGroupSchema.partial();

export const inviteMemberSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
}).refine((d) => d.email || d.phone, "Email or phone required");

// ─── Expenses ─────────────────────────────────────────────────────────────────

export const createExpenseSchema = z.object({
  groupId: z.string().cuid("Invalid group"),
  title: z.string().min(1, "Title required").max(200),
  amount: z.number().positive("Amount must be positive").max(10_000_000),
  currency: z.string().length(3).default("INR"),
  category: z.enum([
    "RENT", "FOOD", "TRANSPORT", "UTILITIES", "ENTERTAINMENT",
    "SUBSCRIPTIONS", "TRAVEL", "SHOPPING", "HEALTH", "EDUCATION", "OTHER",
  ]),
  splitType: z.enum(["EQUAL", "PERCENTAGE", "CUSTOM", "SHARES"]).default("EQUAL"),
  paidById: z.string().cuid("Invalid user"),
  notes: z.string().max(500).optional(),
  tags: z.array(z.string().max(30)).max(10).default([]),
  isRecurring: z.boolean().default(false),
  recurringInterval: z
    .enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"])
    .optional(),
  splits: z.array(
    z.object({
      userId: z.string().cuid(),
      amount: z.number().nonnegative(),
      percentage: z.number().min(0).max(100).optional(),
      shares: z.number().positive().int().optional(),
    })
  ),
});

export const updateExpenseSchema = createExpenseSchema.partial();

// ─── Settlements ──────────────────────────────────────────────────────────────

export const createSettlementSchema = z.object({
  toUserId: z.string().cuid("Invalid user"),
  amount: z.number().positive().max(10_000_000),
  currency: z.string().length(3).default("INR"),
  groupId: z.string().cuid().optional(),
  note: z.string().max(300).optional(),
  method: z.enum(["UPI", "CARD", "NETBANKING", "WALLET", "CASH"]).optional(),
  gateway: z.enum(["RAZORPAY", "STRIPE", "MANUAL"]).optional(),
});

// ─── Payments ─────────────────────────────────────────────────────────────────

export const createPaymentOrderSchema = z.object({
  settlementId: z.string().cuid(),
  gateway: z.enum(["RAZORPAY", "STRIPE"]),
  idempotencyKey: z.string().min(12).max(120).optional(),
});

export const verifyPaymentSchema = z.object({
  settlementId: z.string().cuid(),
  razorpayOrderId: z.string().optional(),
  razorpayPaymentId: z.string().optional(),
  razorpaySignature: z.string().optional(),
  stripePaymentIntentId: z.string().optional(),
  idempotencyKey: z.string().min(12).max(120).optional(),
});

// ─── Subscriptions ────────────────────────────────────────────────────────────

export const createSubscriptionSchema = z.object({
  name: z.string().min(1).max(100),
  logo: z.string().optional(),
  color: z.string().optional(),
  category: z.enum(["STREAMING", "MUSIC", "PRODUCTIVITY", "CLOUD", "GAMING", "OTHER"]),
  monthlyCost: z.number().positive().max(1_000_000),
  currency: z.string().length(3).default("INR"),
  billingCycle: z.enum(["MONTHLY", "YEARLY", "WEEKLY"]).default("MONTHLY"),
  renewalDate: z.string().datetime(),
  autoRenew: z.boolean().default(true),
  groupId: z.string().cuid().optional(),
});

// ─── Notifications ────────────────────────────────────────────────────────────

export const updateNotificationSchema = z.object({
  isRead: z.boolean().optional(),
});

// ─── Billing ──────────────────────────────────────────────────────────────────

export const upgradePlanSchema = z.object({
  plan: z.enum(["PRO", "TEAM"]),
  gateway: z.enum(["RAZORPAY", "STRIPE"]).default("RAZORPAY"),
  idempotencyKey: z.string().min(12).max(120).optional(),
});

export const cancelPlanSchema = z.object({
  reason: z.string().max(500).optional(),
});

// ─── Admin ────────────────────────────────────────────────────────────────────

export const adminUserUpdateSchema = z.object({
  role: z.enum(["USER", "GROUP_ADMIN", "TEAM_ADMIN", "SUPER_ADMIN"]).optional(),
  plan: z.enum(["FREE", "PRO", "TEAM"]).optional(),
  planStatus: z.enum(["ACTIVE", "TRIAL", "GRACE", "CANCELLED", "EXPIRED"]).optional(),
});

// ─── Pagination ───────────────────────────────────────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// ─── Utility type helpers ─────────────────────────────────────────────────────

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type CreateSettlementInput = z.infer<typeof createSettlementSchema>;
export type UpgradePlanInput = z.infer<typeof upgradePlanSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
