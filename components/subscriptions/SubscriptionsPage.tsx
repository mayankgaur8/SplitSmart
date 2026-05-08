"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Plus, AlertTriangle, TrendingDown, Users, Calendar,
  BarChart2, CheckCircle, XCircle, ChevronRight, Zap,
} from "lucide-react";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { Card, StatCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { MOCK_SUBSCRIPTIONS } from "@/lib/mock-data";

const usageColor = (score: number) => {
  if (score >= 70) return "green";
  if (score >= 40) return "orange";
  return "red";
};

const usageBadge = (score: number): "success" | "warning" | "danger" => {
  if (score >= 70) return "success";
  if (score >= 40) return "warning";
  return "danger";
};

const renewalReferenceDate = new Date("2026-05-09T00:00:00+05:30").getTime();

function SubscriptionCard({ sub }: { sub: (typeof MOCK_SUBSCRIPTIONS)[0] }) {
  const daysUntilRenewal = Math.ceil(
    (new Date(sub.renewalDate).getTime() - renewalReferenceDate) / (1000 * 60 * 60 * 24)
  );
  const isUrgent = daysUntilRenewal <= 3;

  return (
    <Card hover glow={sub.usageScore && sub.usageScore < 40 ? "none" : "blue"}
      className={cn(sub.usageScore && sub.usageScore < 40 && "border-amber-500/20")}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: `${sub.color}20`, border: `1px solid ${sub.color}30` }}
          >
            {sub.logo}
          </div>
          <div>
            <h3 className="text-white font-bold text-sm">{sub.name}</h3>
            <p className="text-slate-500 text-xs capitalize mt-0.5">{sub.category}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {sub.autoRenew ? (
            <Badge variant="success" size="sm" dot>Auto-renew</Badge>
          ) : (
            <Badge variant="warning" size="sm">Manual</Badge>
          )}
        </div>
      </div>

      {/* Cost */}
      <div className="flex items-end justify-between mb-4">
        <div>
          <p className="text-2xl font-black text-white">{formatCurrency(sub.monthlyCost, "INR")}</p>
          <p className="text-xs text-slate-500">/month · {formatCurrency(sub.costPerPerson, "INR")}/person</p>
        </div>
        {sub.sharedWith.length > 1 && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Users size={13} />
            <span>{sub.sharedWith.length} people sharing</span>
          </div>
        )}
      </div>

      {/* Usage score */}
      {sub.usageScore !== undefined && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-500">Usage score</span>
            <Badge variant={usageBadge(sub.usageScore)} size="sm">{sub.usageScore}%</Badge>
          </div>
          <ProgressBar value={sub.usageScore} color={usageColor(sub.usageScore) as "green" | "orange" | "red"} size="sm" />
          {sub.usageScore < 40 && (
            <div className="flex items-center gap-1.5 mt-2 text-amber-400">
              <AlertTriangle size={12} />
              <span className="text-[11px] font-medium">Low usage — consider canceling</span>
            </div>
          )}
        </div>
      )}

      {/* Renewal */}
      <div className={cn(
        "flex items-center justify-between p-3 rounded-xl",
        isUrgent ? "bg-red-500/10 border border-red-500/20" : "bg-white/4 border border-white/6"
      )}>
        <div className="flex items-center gap-2">
          <Calendar size={13} className={isUrgent ? "text-red-400" : "text-slate-500"} />
          <span className={cn("text-xs font-medium", isUrgent ? "text-red-400" : "text-slate-400")}>
            {isUrgent ? `Renews in ${daysUntilRenewal} days!` : `Renews ${formatDate(sub.renewalDate)}`}
          </span>
        </div>
        <ChevronRight size={14} className="text-slate-600" />
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-3">
        <Button size="xs" variant="secondary" fullWidth>Manage</Button>
        {sub.usageScore !== undefined && sub.usageScore < 50 && (
          <Button size="xs" variant="danger" fullWidth leftIcon={<XCircle size={12} />}>Cancel</Button>
        )}
      </div>
    </Card>
  );
}

export function SubscriptionsPage() {
  const [filter, setFilter] = useState<"all" | "streaming" | "music" | "productivity" | "cloud" | "gaming">("all");

  const filtered = MOCK_SUBSCRIPTIONS.filter(
    (s) => filter === "all" || s.category === filter
  );

  const totalMonthly = MOCK_SUBSCRIPTIONS.reduce((sum, s) => sum + s.monthlyCost, 0);
  const myCost = MOCK_SUBSCRIPTIONS.reduce((sum, s) => sum + s.costPerPerson, 0);
  const wastedSubs = MOCK_SUBSCRIPTIONS.filter((s) => (s.usageScore ?? 100) < 40);
  const potentialSaving = wastedSubs.reduce((sum, s) => sum + s.costPerPerson, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h1 className="text-2xl font-black text-white">Subscription Manager</h1>
          <p className="text-slate-400 text-sm mt-0.5">Track, split, and optimize all your subscriptions</p>
        </div>
        <Button leftIcon={<Plus size={15} />}>Add Subscription</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Monthly"
          value={formatCurrency(totalMonthly, "INR")}
          change={`${MOCK_SUBSCRIPTIONS.length} active subs`}
          icon={<BarChart2 size={18} />}
          iconColor="bg-sky-500/15 text-sky-400"
        />
        <StatCard
          title="Your Share"
          value={formatCurrency(myCost, "INR")}
          change="After splitting"
          changeType="positive"
          icon={<Users size={18} />}
          iconColor="bg-emerald-500/15 text-emerald-400"
        />
        <StatCard
          title="Potential Savings"
          value={formatCurrency(potentialSaving, "INR")}
          change={`${wastedSubs.length} underused`}
          changeType={potentialSaving > 0 ? "negative" : "positive"}
          icon={<TrendingDown size={18} />}
          iconColor="bg-amber-500/15 text-amber-400"
        />
        <StatCard
          title="Yearly Projection"
          value={formatCurrency(myCost * 12, "INR")}
          change="Current rate"
          icon={<Calendar size={18} />}
          iconColor="bg-violet-500/15 text-violet-400"
        />
      </div>

      {/* AI Recommendation banner */}
      {wastedSubs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 p-4 rounded-2xl bg-amber-500/8 border border-amber-500/20"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-400">AI Savings Opportunity</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Cancel {wastedSubs.map((s) => s.name).join(", ")} — save{" "}
              <strong className="text-amber-400">{formatCurrency(potentialSaving, "INR")}/month</strong> based on low usage.
            </p>
          </div>
          <Button size="sm" variant="secondary">Review</Button>
        </motion.div>
      )}

      {/* Category filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {(["all", "streaming", "music", "productivity", "cloud", "gaming"] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={cn(
              "flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize",
              filter === cat
                ? "bg-sky-500/15 text-sky-400 border border-sky-500/25"
                : "bg-white/5 text-slate-400 border border-white/8 hover:text-white"
            )}
          >
            {cat === "all" ? "All" : cat}
          </button>
        ))}
      </div>

      {/* Subscription cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((sub, i) => (
          <motion.div
            key={sub.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <SubscriptionCard sub={sub} />
          </motion.div>
        ))}
        {/* Add new */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: filtered.length * 0.08 }}
        >
          <button className="w-full min-h-[280px] rounded-2xl border-2 border-dashed border-white/12 flex flex-col items-center justify-center gap-3 hover:border-sky-500/40 hover:bg-sky-500/4 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-white/6 border border-white/10 flex items-center justify-center group-hover:bg-sky-500/15 group-hover:border-sky-500/25 transition-all">
              <Plus className="w-5 h-5 text-slate-400 group-hover:text-sky-400 transition-colors" />
            </div>
            <div className="text-center">
              <p className="text-sm text-slate-500 group-hover:text-sky-400 font-medium transition-colors">Add Subscription</p>
              <p className="text-xs text-slate-600 mt-1">Netflix, Spotify, and 50+ more</p>
            </div>
          </button>
        </motion.div>
      </div>

      {/* Upcoming renewals table */}
      <Card padding="md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white">Upcoming Renewals</h2>
          <Badge variant="warning">3 this week</Badge>
        </div>
        <div className="space-y-0">
          {MOCK_SUBSCRIPTIONS.sort(
            (a, b) => new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime()
          ).map((sub) => {
            const days = Math.ceil((new Date(sub.renewalDate).getTime() - renewalReferenceDate) / (1000 * 60 * 60 * 24));
            return (
              <div key={sub.id} className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0">
                <span className="text-xl">{sub.logo}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{sub.name}</p>
                  <p className="text-xs text-slate-500">{formatCurrency(sub.costPerPerson, "INR")}/person</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">{formatCurrency(sub.monthlyCost, "INR")}</p>
                  <p className={cn("text-xs", days <= 3 ? "text-red-400" : days <= 7 ? "text-amber-400" : "text-slate-500")}>
                    {days <= 0 ? "Today" : `${days}d`}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {sub.autoRenew
                    ? <CheckCircle size={15} className="text-emerald-400" />
                    : <AlertTriangle size={15} className="text-amber-400" />}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
