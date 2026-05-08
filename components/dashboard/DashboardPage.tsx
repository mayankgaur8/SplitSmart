"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  TrendingUp, TrendingDown, ArrowLeftRight, Flame,
  Brain, Plus, ChevronRight, Zap, Clock, CheckCircle,
  AlertCircle, Users, CreditCard, Star,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { formatCurrency, formatRelativeTime, cn } from "@/lib/utils";
import { Card, StatCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar, AvatarGroup } from "@/components/ui/Avatar";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  CURRENT_USER, MOCK_GROUPS, MOCK_EXPENSES, MOCK_SETTLEMENTS,
  AI_INSIGHTS, MONTHLY_SPEND,
} from "@/lib/mock-data";

/* ─── Spend chart tooltip ─────────────────────────────────────────────────── */
function SpendTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0d1128] border border-white/10 rounded-xl px-3 py-2 shadow-xl">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className="text-sm font-bold text-white">{formatCurrency(payload[0].value, "INR")}</p>
    </div>
  );
}

/* ─── Group card ─────────────────────────────────────────────────────────── */
function GroupCard({ group }: { group: (typeof MOCK_GROUPS)[0] }) {
  const myMember = group.members.find((m) => m.userId === CURRENT_USER.id);
  const balance = myMember?.balance ?? 0;
  const isOwed = balance > 0;

  const categoryEmojis: Record<string, string> = {
    flatmates: "🏠", travel: "✈️", friends: "👥", couple: "💑",
    family: "👨‍👩‍👧", team: "💼", subscriptions: "📺", other: "📌",
  };

  return (
    <Link href={`/groups`}>
      <Card hover glow="blue" className="cursor-pointer">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500/20 to-violet-500/20 border border-white/10 flex items-center justify-center text-xl">
              {categoryEmojis[group.category]}
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm leading-tight">{group.name}</h3>
              <p className="text-slate-500 text-xs mt-0.5">{group.members.length} members</p>
            </div>
          </div>
          <Badge variant={isOwed ? "success" : balance < 0 ? "danger" : "default"}>
            {isOwed ? "+" : ""}{formatCurrency(Math.abs(balance), "INR")}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <AvatarGroup users={group.members.map((m) => ({ name: m.user.name }))} max={3} size="xs" />
          <span className="text-xs text-slate-500">
            Total: {formatCurrency(group.totalExpenses, "INR")}
          </span>
        </div>
      </Card>
    </Link>
  );
}

/* ─── Activity item ─────────────────────────────────────────────────────── */
function ActivityItem({ expense }: { expense: (typeof MOCK_EXPENSES)[0] }) {
  const categoryIcons: Record<string, string> = {
    rent: "🏠", food: "🍽️", transport: "🚗", utilities: "⚡",
    entertainment: "🎬", subscriptions: "📺", travel: "✈️", shopping: "🛍️",
    health: "💊", education: "📚", other: "📌",
  };

  const unpaidSplits = expense.splits.filter((s) => !s.isPaid).length;
  const myShare = expense.splits.find((s) => s.userId === CURRENT_USER.id);

  return (
    <div className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0">
      <div className="w-9 h-9 rounded-xl bg-white/6 border border-white/8 flex items-center justify-center text-base flex-shrink-0">
        {categoryIcons[expense.category]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{expense.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-slate-500">{formatRelativeTime(expense.createdAt)}</span>
          {unpaidSplits > 0 && (
            <Badge variant="warning" size="sm">{unpaidSplits} pending</Badge>
          )}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-semibold text-white">{formatCurrency(expense.amount, "INR")}</p>
        {myShare && (
          <p className={cn("text-xs", myShare.isPaid ? "text-emerald-400" : "text-amber-400")}>
            Your share: {formatCurrency(myShare.amount, "INR")}
          </p>
        )}
      </div>
    </div>
  );
}

/* ─── AI Insight card ───────────────────────────────────────────────────── */
function AIInsightCard({ insight }: { insight: (typeof AI_INSIGHTS)[0] }) {
  const config = {
    saving: { icon: TrendingDown, bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400", badge: "success" as const },
    warning: { icon: AlertCircle, bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-400", badge: "warning" as const },
    recommendation: { icon: Brain, bg: "bg-violet-500/10", border: "border-violet-500/20", text: "text-violet-400", badge: "purple" as const },
    achievement: { icon: Star, bg: "bg-sky-500/10", border: "border-sky-500/20", text: "text-sky-400", badge: "info" as const },
  };
  const c = config[insight.type];
  const Icon = c.icon;

  return (
    <div className={cn("flex items-start gap-3 p-4 rounded-xl border transition-all hover:brightness-110", c.bg, c.border)}>
      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", c.bg, "border", c.border)}>
        <Icon className={cn("w-4 h-4", c.text)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-semibold text-white">{insight.title}</p>
          {insight.savingAmount && (
            <Badge variant={c.badge}>Save {formatCurrency(insight.savingAmount, "INR")}/mo</Badge>
          )}
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">{insight.description}</p>
        {insight.actionLabel && (
          <button className={cn("text-xs font-semibold mt-2", c.text, "hover:opacity-80 transition-opacity")}>
            {insight.actionLabel} →
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Main Dashboard ─────────────────────────────────────────────────────── */
export function DashboardPage() {
  const pendingSettlements = MOCK_SETTLEMENTS.filter((s) => s.status === "pending");
  const totalOwed = pendingSettlements
    .filter((s) => s.toUserId === CURRENT_USER.id)
    .reduce((sum, s) => sum + s.amount, 0);
  const totalOwing = pendingSettlements
    .filter((s) => s.fromUserId === CURRENT_USER.id)
    .reduce((sum, s) => sum + s.amount, 0);
  const netBalance = totalOwed - totalOwing;

  const fadeIn = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };

  return (
    <div className="space-y-6">
      {/* Welcome row */}
      <motion.div {...fadeIn} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">
            Good morning, {CURRENT_USER.name.split(" ")[0]} 👋
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            You have <strong className="text-white">{pendingSettlements.length} pending settlements</strong> to review
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Streak badge */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <Flame className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-bold text-amber-400">{CURRENT_USER.paymentStreak} day streak</span>
          </div>
          <Link href="/expenses/new"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-violet-500 text-white text-sm font-bold hover:opacity-90 transition-opacity">
            <Plus size={15} />
            Add Expense
          </Link>
        </div>
      </motion.div>

      {/* Stat cards */}
      <motion.div {...fadeIn} transition={{ delay: 0.05 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="You're Owed"
          value={formatCurrency(totalOwed, "INR")}
          change={`${pendingSettlements.filter((s) => s.toUserId === CURRENT_USER.id).length} pending`}
          changeType="positive"
          icon={<TrendingUp size={18} />}
          iconColor="bg-emerald-500/15 text-emerald-400"
        />
        <StatCard
          title="You Owe"
          value={formatCurrency(totalOwing, "INR")}
          change="Settle now"
          changeType="negative"
          icon={<TrendingDown size={18} />}
          iconColor="bg-red-500/15 text-red-400"
        />
        <StatCard
          title="Net Balance"
          value={formatCurrency(Math.abs(netBalance), "INR")}
          change={netBalance >= 0 ? "In your favour" : "You owe more"}
          changeType={netBalance >= 0 ? "positive" : "negative"}
          icon={<ArrowLeftRight size={18} />}
          iconColor="bg-sky-500/15 text-sky-400"
        />
        <StatCard
          title="Reputation Score"
          value={String(CURRENT_USER.reputationScore)}
          change="Top 8% of users"
          changeType="positive"
          icon={<Zap size={18} />}
          iconColor="bg-violet-500/15 text-violet-400"
        />
      </motion.div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — groups + activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Spend chart */}
          <motion.div {...fadeIn} transition={{ delay: 0.1 }}>
            <Card padding="md">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-base font-bold text-white">Monthly Spending</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Last 6 months</p>
                </div>
                <Badge variant="info">₹44,800 this month</Badge>
              </div>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={MONTHLY_SPEND} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip content={<SpendTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke="#0ea5e9"
                      strokeWidth={2}
                      fill="url(#spendGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </motion.div>

          {/* Groups */}
          <motion.div {...fadeIn} transition={{ delay: 0.15 }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-white">Your Groups</h2>
              <Link href="/groups" className="flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 font-medium">
                View all <ChevronRight size={13} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {MOCK_GROUPS.slice(0, 4).map((g) => (
                <GroupCard key={g.id} group={g} />
              ))}
            </div>
          </motion.div>

          {/* Recent activity */}
          <motion.div {...fadeIn} transition={{ delay: 0.2 }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-white">Recent Activity</h2>
              <Link href="/expenses" className="flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 font-medium">
                View all <ChevronRight size={13} />
              </Link>
            </div>
            <Card padding="sm">
              {MOCK_EXPENSES.slice(0, 5).map((e) => (
                <ActivityItem key={e.id} expense={e} />
              ))}
            </Card>
          </motion.div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Gamification */}
          <motion.div {...fadeIn} transition={{ delay: 0.1 }}>
            <Card padding="md" className="bg-gradient-to-b from-violet-500/8 to-sky-500/5 border-violet-500/20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-white">Your Reputation</h2>
                <Link href="/gamification" className="text-xs text-violet-400 hover:text-violet-300">View →</Link>
              </div>
              {/* Score ring */}
              <div className="flex items-center gap-4 mb-4">
                <div className="relative w-16 h-16 flex-shrink-0">
                  <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
                    <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
                    <circle cx="32" cy="32" r="28" fill="none" stroke="url(#scoreGrad)" strokeWidth="6"
                      strokeDasharray={`${(CURRENT_USER.reputationScore / 100) * 175.9} 175.9`}
                      strokeLinecap="round" />
                    <defs>
                      <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#0ea5e9" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-black text-white">{CURRENT_USER.reputationScore}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-white font-bold text-sm">Reliable Payer</p>
                  <p className="text-slate-500 text-xs mt-0.5">Top 8% this month</p>
                  <ProgressBar value={CURRENT_USER.reputationScore} className="mt-2" size="xs" />
                </div>
              </div>
              {/* Streak */}
              <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/8 border border-amber-500/15">
                <Flame className="w-4 h-4 text-amber-400" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-white">{CURRENT_USER.paymentStreak} day streak!</p>
                  <p className="text-[10px] text-slate-500">Keep paying on time to maintain it</p>
                </div>
              </div>
              {/* Badges */}
              <div className="mt-4">
                <p className="text-xs text-slate-500 mb-2">Recent badges</p>
                <div className="flex gap-2 flex-wrap">
                  {["⚡ Instant Payer", "🏠 Reliable Flatmate", "🔥 7-Day Streak"].map((b) => (
                    <span key={b} className="text-xs bg-white/8 border border-white/10 rounded-full px-2.5 py-1 text-slate-300">
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Pending settlements */}
          <motion.div {...fadeIn} transition={{ delay: 0.15 }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-white">Pending Settlements</h2>
              <Link href="/settlements" className="text-xs text-sky-400 hover:text-sky-300">View all →</Link>
            </div>
            <Card padding="sm">
              {pendingSettlements.slice(0, 3).map((s) => {
                const isReceiving = s.toUserId === CURRENT_USER.id;
                const otherUserId = isReceiving ? s.fromUserId : s.toUserId;
                const otherUser = ["user-2", "user-3", "user-4", "user-5"].includes(otherUserId)
                  ? ["Priya Sharma", "Rahul Mehta", "Ananya Patel", "Karan Singh"][
                    ["user-2", "user-3", "user-4", "user-5"].indexOf(otherUserId)
                  ]
                  : "Unknown";

                return (
                  <div key={s.id} className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0">
                    <Avatar name={otherUser} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white">{otherUser}</p>
                      <p className="text-[11px] text-slate-500">
                        {isReceiving ? "owes you" : "you owe"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={cn("text-sm font-bold", isReceiving ? "text-emerald-400" : "text-red-400")}>
                        {isReceiving ? "+" : "-"}{formatCurrency(s.amount, "INR")}
                      </p>
                      {!isReceiving && (
                        <button className="text-[10px] text-sky-400 hover:text-sky-300 font-semibold">Pay UPI →</button>
                      )}
                    </div>
                  </div>
                );
              })}
              <Link href="/settlements"
                className="flex items-center justify-center gap-1.5 mt-3 py-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold hover:bg-sky-500/15 transition-colors">
                <Zap size={12} />
                Settle All Now
              </Link>
            </Card>
          </motion.div>

          {/* AI Insights */}
          <motion.div {...fadeIn} transition={{ delay: 0.2 }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-violet-400" />
                <h2 className="text-sm font-bold text-white">AI Insights</h2>
              </div>
              <Badge variant="purple">4 new</Badge>
            </div>
            <div className="space-y-3">
              {AI_INSIGHTS.slice(0, 3).map((ins) => (
                <AIInsightCard key={ins.id} insight={ins} />
              ))}
            </div>
          </motion.div>

          {/* Upcoming subscriptions */}
          <motion.div {...fadeIn} transition={{ delay: 0.25 }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-white">Renewing Soon</h2>
              <Link href="/subscriptions" className="text-xs text-sky-400 hover:text-sky-300">View all →</Link>
            </div>
            <Card padding="sm">
              {[
                { name: "Netflix", logo: "🎬", date: "Mar 1", cost: 649, color: "text-red-400" },
                { name: "Spotify", logo: "🎵", date: "Mar 5", cost: 119, color: "text-emerald-400" },
                { name: "Amazon Prime", logo: "📦", date: "Mar 10", cost: 299, color: "text-amber-400" },
              ].map((sub) => (
                <div key={sub.name} className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0">
                  <span className="text-xl">{sub.logo}</span>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-white">{sub.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock size={10} className="text-slate-600" />
                      <span className="text-[10px] text-slate-500">{sub.date}</span>
                    </div>
                  </div>
                  <span className={cn("text-xs font-semibold", sub.color)}>
                    {formatCurrency(sub.cost, "INR")}
                  </span>
                </div>
              ))}
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
