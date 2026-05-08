// ─── User & Auth ────────────────────────────────────────────────────────────

export type PlanType = "free" | "pro" | "team";
export type UserRole = "owner" | "admin" | "member";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
  plan: PlanType;
  reputationScore: number;
  paymentStreak: number;
  badges: BadgeId[];
  totalPaid: number;
  totalOwed: number;
  joinedAt: string;
  currency: string;
  isOnline?: boolean;
}

// ─── Groups ─────────────────────────────────────────────────────────────────

export type GroupCategory =
  | "flatmates"
  | "travel"
  | "friends"
  | "couple"
  | "family"
  | "team"
  | "subscriptions"
  | "other";

export interface GroupMember {
  userId: string;
  user: User;
  role: UserRole;
  balance: number;
  joinedAt: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  category: GroupCategory;
  members: GroupMember[];
  createdBy: string;
  createdAt: string;
  totalExpenses: number;
  currency: string;
  imageUrl?: string;
  inviteCode: string;
  isArchived: boolean;
}

// ─── Expenses ────────────────────────────────────────────────────────────────

export type SplitType = "equal" | "percentage" | "custom" | "shares";
export type ExpenseCategory =
  | "rent"
  | "food"
  | "transport"
  | "utilities"
  | "entertainment"
  | "subscriptions"
  | "travel"
  | "shopping"
  | "health"
  | "education"
  | "other";

export interface ExpenseSplit {
  userId: string;
  amount: number;
  percentage?: number;
  shares?: number;
  isPaid: boolean;
  paidAt?: string;
}

export interface Expense {
  id: string;
  groupId: string;
  title: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  splitType: SplitType;
  splits: ExpenseSplit[];
  paidBy: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  receiptUrl?: string;
  notes?: string;
  isRecurring: boolean;
  recurringInterval?: "daily" | "weekly" | "monthly" | "yearly";
  nextDueDate?: string;
  tags: string[];
}

// ─── Subscriptions ───────────────────────────────────────────────────────────

export interface Subscription {
  id: string;
  name: string;
  logo: string;
  color: string;
  monthlyCost: number;
  currency: string;
  billingCycle: "monthly" | "yearly" | "weekly";
  renewalDate: string;
  groupId?: string;
  sharedWith: string[];
  costPerPerson: number;
  category: "streaming" | "music" | "productivity" | "cloud" | "gaming" | "other";
  isActive: boolean;
  autoRenew: boolean;
  usageScore?: number;
  lastUsed?: string;
}

// ─── Settlements ─────────────────────────────────────────────────────────────

export type SettlementStatus = "pending" | "completed" | "failed" | "partial";

export interface Settlement {
  id: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  currency: string;
  status: SettlementStatus;
  method?: "upi" | "card" | "wallet" | "bank" | "cash";
  groupId?: string;
  createdAt: string;
  completedAt?: string;
  note?: string;
  transactionId?: string;
}

// ─── Gamification ────────────────────────────────────────────────────────────

export type BadgeId =
  | "instant_payer"
  | "reliable_flatmate"
  | "rent_king"
  | "budget_master"
  | "social_butterfly"
  | "streak_7"
  | "streak_30"
  | "streak_100"
  | "first_split"
  | "group_creator"
  | "early_adopter"
  | "savings_guru";

export interface Badge {
  id: BadgeId;
  name: string;
  description: string;
  icon: string;
  color: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  unlockedAt?: string;
}

export interface LeaderboardEntry {
  rank: number;
  user: User;
  score: number;
  streak: number;
  totalPaid: number;
  change: "up" | "down" | "same";
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export interface MonthlySpend {
  month: string;
  total: number;
  rent: number;
  food: number;
  entertainment: number;
  subscriptions: number;
  other: number;
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface AIInsight {
  id: string;
  type: "saving" | "warning" | "recommendation" | "achievement";
  title: string;
  description: string;
  savingAmount?: number;
  actionLabel?: string;
  createdAt: string;
}

// ─── Notifications ───────────────────────────────────────────────────────────

export type NotificationType =
  | "payment_due"
  | "payment_received"
  | "expense_added"
  | "group_invite"
  | "settlement_request"
  | "subscription_renewal"
  | "badge_earned"
  | "streak_milestone";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalRevenue: number;
  mrr: number;
  totalTransactions: number;
  totalGroups: number;
  proUsers: number;
  teamUsers: number;
  churnRate: number;
  nps: number;
}

export interface RevenueEntry {
  month: string;
  mrr: number;
  newRevenue: number;
  churned: number;
  total: number;
}
