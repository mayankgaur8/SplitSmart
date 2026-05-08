"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, ArrowRight, CheckCircle, Clock, AlertCircle,
  Smartphone, CreditCard, Building, Wallet, ArrowLeftRight,
  TrendingDown, Users, ChevronDown,
} from "lucide-react";
import { formatCurrency, formatDate, formatRelativeTime, calculateDebtMinimization, cn } from "@/lib/utils";
import { Card, StatCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { MOCK_SETTLEMENTS, MOCK_USERS, MOCK_GROUPS, CURRENT_USER } from "@/lib/mock-data";

const paymentMethods = [
  { id: "upi", label: "UPI", icon: Smartphone, desc: "Google Pay, PhonePe, Paytm" },
  { id: "card", label: "Card", icon: CreditCard, desc: "Credit / Debit card" },
  { id: "bank", label: "Bank", icon: Building, desc: "NEFT / IMPS transfer" },
  { id: "wallet", label: "Wallet", icon: Wallet, desc: "Paytm, Amazon Pay" },
];

const statusConfig = {
  pending: { label: "Pending", badge: "warning" as const, icon: Clock },
  completed: { label: "Paid", badge: "success" as const, icon: CheckCircle },
  failed: { label: "Failed", badge: "danger" as const, icon: AlertCircle },
  partial: { label: "Partial", badge: "info" as const, icon: ArrowLeftRight },
};

function SettlementCard({ settlement }: { settlement: (typeof MOCK_SETTLEMENTS)[0] }) {
  const [expanded, setExpanded] = useState(false);
  const [paying, setPaying] = useState(false);
  const [method, setMethod] = useState("upi");

  const fromUser = MOCK_USERS.find((u) => u.id === settlement.fromUserId);
  const toUser = MOCK_USERS.find((u) => u.id === settlement.toUserId);
  const group = MOCK_GROUPS.find((g) => g.id === settlement.groupId);
  const sc = statusConfig[settlement.status];
  const StatusIcon = sc.icon;

  const isMePaying = settlement.fromUserId === CURRENT_USER.id;
  const isMeReceiving = settlement.toUserId === CURRENT_USER.id;

  return (
    <motion.div
      layout
      className={cn(
        "rounded-2xl border transition-all",
        settlement.status === "pending" && isMePaying
          ? "bg-red-500/5 border-red-500/20"
          : settlement.status === "pending" && isMeReceiving
          ? "bg-emerald-500/5 border-emerald-500/20"
          : "bg-[#0d1128]/80 border-white/8"
      )}
    >
      <div
        className="flex items-center gap-4 p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Arrow */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-shrink-0">
            <Avatar name={fromUser?.name ?? "?"} size="sm" />
            <div className="text-center">
              <ArrowRight size={14} className={cn(
                isMePaying ? "text-red-400" : "text-emerald-400"
              )} />
            </div>
            <Avatar name={toUser?.name ?? "?"} size="sm" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {isMePaying ? `You owe ${toUser?.name}` :
               isMeReceiving ? `${fromUser?.name} owes you` :
               `${fromUser?.name} → ${toUser?.name}`}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {group && <span className="text-[11px] text-slate-500">{group.name}</span>}
              {settlement.note && <span className="text-[11px] text-slate-600 truncate">· {settlement.note}</span>}
            </div>
          </div>
        </div>

        {/* Amount + status */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <p className={cn(
              "text-base font-bold",
              isMePaying ? "text-red-400" : isMeReceiving ? "text-emerald-400" : "text-white"
            )}>
              {isMePaying ? "-" : isMeReceiving ? "+" : ""}{formatCurrency(settlement.amount, "INR")}
            </p>
            <p className="text-[11px] text-slate-500">{formatRelativeTime(settlement.createdAt)}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant={sc.badge} size="sm" dot>{sc.label}</Badge>
            <ChevronDown size={14} className={cn("text-slate-500 transition-transform", expanded && "rotate-180")} />
          </div>
        </div>
      </div>

      {/* Expanded */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/6"
          >
            <div className="p-4 space-y-4">
              {settlement.status === "pending" && isMePaying && !paying && (
                <div>
                  <p className="text-xs font-medium text-slate-400 mb-3">Choose payment method</p>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {paymentMethods.map((pm) => {
                      const Icon = pm.icon;
                      return (
                        <button
                          key={pm.id}
                          onClick={() => setMethod(pm.id)}
                          className={cn(
                            "flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all",
                            method === pm.id
                              ? "border-sky-500/40 bg-sky-500/10"
                              : "border-white/8 bg-white/3 hover:border-white/15"
                          )}
                        >
                          <Icon size={16} className={method === pm.id ? "text-sky-400" : "text-slate-400"} />
                          <div>
                            <p className={cn("text-xs font-semibold", method === pm.id ? "text-sky-400" : "text-slate-300")}>
                              {pm.label}
                            </p>
                            <p className="text-[10px] text-slate-600">{pm.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <Button
                    fullWidth
                    leftIcon={<Zap size={14} />}
                    onClick={() => setPaying(true)}
                  >
                    Pay {formatCurrency(settlement.amount, "INR")} via {method.toUpperCase()}
                  </Button>
                </div>
              )}

              {paying && (
                <div className="text-center py-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-6 h-6 text-emerald-400" />
                  </div>
                  <p className="text-white font-bold">Payment Initiated!</p>
                  <p className="text-slate-500 text-sm mt-1">
                    {formatCurrency(settlement.amount, "INR")} via {method.toUpperCase()}
                  </p>
                  <p className="text-xs text-slate-600 mt-2">
                    Transaction ID: UPI{settlement.id.toUpperCase().slice(-8)}
                  </p>
                </div>
              )}

              {settlement.status === "completed" && (
                <div className="flex items-center gap-2 text-sm text-emerald-400">
                  <CheckCircle size={15} />
                  <span>Paid on {settlement.completedAt ? formatDate(settlement.completedAt) : "—"}</span>
                  {settlement.transactionId && (
                    <span className="text-slate-600 font-mono text-xs ml-auto">{settlement.transactionId}</span>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function SettlementsPage() {
  const [activeTab, setActiveTab] = useState<"pending" | "completed" | "all">("pending");

  // Debt minimization demo
  const rawDebts = [
    { from: "Rahul", to: "Mayank", amount: 20000 },
    { from: "Priya", to: "Mayank", amount: 6000 },
    { from: "Karan", to: "Mayank", amount: 6000 },
    { from: "Mayank", to: "Ananya", amount: 2800 },
    { from: "Rahul", to: "Priya", amount: 800 },
  ];
  const optimized = calculateDebtMinimization(rawDebts);

  const filtered = MOCK_SETTLEMENTS.filter((s) =>
    activeTab === "all" ? true : s.status === activeTab
  );

  const totalPending = MOCK_SETTLEMENTS.filter((s) => s.status === "pending")
    .filter((s) => s.toUserId === CURRENT_USER.id)
    .reduce((sum, s) => sum + s.amount, 0);

  const totalOwing = MOCK_SETTLEMENTS.filter((s) => s.status === "pending")
    .filter((s) => s.fromUserId === CURRENT_USER.id)
    .reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h1 className="text-2xl font-black text-white">Settlements</h1>
          <p className="text-slate-400 text-sm mt-0.5">Resolve debts with minimal payments</p>
        </div>
        <Button leftIcon={<Zap size={15} />}>Settle All</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="You're Owed"
          value={formatCurrency(totalPending, "INR")}
          change={`${MOCK_SETTLEMENTS.filter((s) => s.toUserId === CURRENT_USER.id && s.status === "pending").length} people owe you`}
          changeType="positive"
          icon={<TrendingDown size={18} />}
          iconColor="bg-emerald-500/15 text-emerald-400"
        />
        <StatCard
          title="You Owe"
          value={formatCurrency(totalOwing, "INR")}
          change="Pay now to maintain streak"
          changeType="negative"
          icon={<ArrowRight size={18} />}
          iconColor="bg-red-500/15 text-red-400"
        />
        <StatCard
          title="Completed This Month"
          value={formatCurrency(2800, "INR")}
          change="1 settlement done"
          changeType="positive"
          icon={<CheckCircle size={18} />}
          iconColor="bg-sky-500/15 text-sky-400"
        />
      </div>

      {/* Debt minimization card */}
      <Card className="bg-gradient-to-br from-sky-500/8 to-violet-500/8 border-sky-500/20">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-violet-500 flex items-center justify-center flex-shrink-0">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-white font-bold">Debt Minimization Engine</h3>
              <Badge variant="info" size="sm">AI Powered</Badge>
            </div>
            <p className="text-slate-400 text-sm mb-4">
              Across 5 raw debts in your group, our algorithm reduced them to just{" "}
              <strong className="text-sky-400">{optimized.length} payments</strong>.
            </p>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/8 border border-white/10">
                <span className="text-2xl font-black text-red-400">{rawDebts.length}</span>
                <span className="text-xs text-slate-400">original<br />payments</span>
              </div>
              <ArrowRight className="text-sky-400" />
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-2xl font-black text-emerald-400">{optimized.length}</span>
                <span className="text-xs text-slate-400">optimized<br />payments</span>
              </div>
              <div className="text-xs text-emerald-400 font-semibold">
                {Math.round((1 - optimized.length / rawDebts.length) * 100)}% fewer transactions
              </div>
            </div>
            <div className="space-y-2">
              {optimized.map((t, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="text-white font-medium">{t.from}</span>
                  <ArrowRight size={13} className="text-sky-400" />
                  <span className="text-white font-medium">{t.to}</span>
                  <span className="ml-auto text-emerald-400 font-bold">{formatCurrency(t.amount, "INR")}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/5 w-fit">
        {(["pending", "completed", "all"] as const).map((t) => {
          const count = MOCK_SETTLEMENTS.filter((s) => t === "all" || s.status === t).length;
          return (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all capitalize",
                activeTab === t ? "bg-white/15 text-white" : "text-slate-500 hover:text-slate-300"
              )}
            >
              {t}
              <span className={cn("text-xs px-1.5 py-0.5 rounded-full", activeTab === t ? "bg-white/20" : "bg-white/8")}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Settlement cards */}
      <div className="space-y-3">
        {filtered.map((settlement, i) => (
          <motion.div
            key={settlement.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <SettlementCard settlement={settlement} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
