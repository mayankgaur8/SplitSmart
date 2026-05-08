"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, Filter, Camera, Receipt, SplitSquareHorizontal,
  Equal, Percent, Hash, RefreshCw, Tag, ChevronDown, X,
} from "lucide-react";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { MOCK_EXPENSES, MOCK_GROUPS, MOCK_USERS, CURRENT_USER } from "@/lib/mock-data";
import type { SplitType, ExpenseCategory } from "@/lib/types";

const categoryMeta: Record<ExpenseCategory, { emoji: string; color: string }> = {
  rent: { emoji: "🏠", color: "bg-sky-500/15 text-sky-400" },
  food: { emoji: "🍽️", color: "bg-orange-500/15 text-orange-400" },
  transport: { emoji: "🚗", color: "bg-blue-500/15 text-blue-400" },
  utilities: { emoji: "⚡", color: "bg-yellow-500/15 text-yellow-400" },
  entertainment: { emoji: "🎬", color: "bg-pink-500/15 text-pink-400" },
  subscriptions: { emoji: "📺", color: "bg-red-500/15 text-red-400" },
  travel: { emoji: "✈️", color: "bg-violet-500/15 text-violet-400" },
  shopping: { emoji: "🛍️", color: "bg-purple-500/15 text-purple-400" },
  health: { emoji: "💊", color: "bg-emerald-500/15 text-emerald-400" },
  education: { emoji: "📚", color: "bg-teal-500/15 text-teal-400" },
  other: { emoji: "📌", color: "bg-slate-500/15 text-slate-400" },
};

const splitTypeConfig: Record<SplitType, { icon: React.FC<{ size?: number }>, label: string, desc: string }> = {
  equal: { icon: Equal, label: "Equal Split", desc: "Divide evenly between all members" },
  percentage: { icon: Percent, label: "Percentage", desc: "Each person pays a set percentage" },
  custom: { icon: SplitSquareHorizontal, label: "Custom Amount", desc: "Specify exact amount per person" },
  shares: { icon: Hash, label: "By Shares", desc: "Divide by number of shares" },
};

function ExpenseRow({ expense }: { expense: (typeof MOCK_EXPENSES)[0] }) {
  const [expanded, setExpanded] = useState(false);
  const cat = categoryMeta[expense.category];
  const paidByUser = MOCK_USERS.find((u) => u.id === expense.paidBy);
  const myShare = expense.splits.find((s) => s.userId === CURRENT_USER.id);
  const paidCount = expense.splits.filter((s) => s.isPaid).length;
  const totalShares = expense.splits.length;
  const group = MOCK_GROUPS.find((g) => g.id === expense.groupId);

  return (
    <div className="border-b border-white/6 last:border-0">
      <div
        className="flex items-center gap-3 py-4 cursor-pointer hover:bg-white/2 rounded-xl px-2 -mx-2 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0", cat.color.split(" ")[0])}>
          {cat.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-white truncate">{expense.title}</p>
            {expense.isRecurring && (
              <RefreshCw size={11} className="text-sky-400 flex-shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-slate-500">{group?.name}</span>
            <span className="text-slate-700">·</span>
            <span className="text-xs text-slate-500">{formatDate(expense.createdAt)}</span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-bold text-white">{formatCurrency(expense.amount, "INR")}</p>
          {myShare && (
            <p className={cn("text-xs mt-0.5", myShare.isPaid ? "text-emerald-400" : "text-amber-400")}>
              Your: {formatCurrency(myShare.amount, "INR")}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="hidden sm:flex items-center gap-1.5">
            <ProgressBar value={paidCount} max={totalShares} size="xs" className="w-16" />
            <span className="text-xs text-slate-500">{paidCount}/{totalShares}</span>
          </div>
          <Badge variant={expense.category === "rent" ? "info" : "default"} size="sm">
            {cat.emoji} {expense.category}
          </Badge>
          <ChevronDown size={14} className={cn("text-slate-500 transition-transform", expanded && "rotate-180")} />
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pb-4 px-2 space-y-3">
              {/* Split details */}
              <div className="p-3 rounded-xl bg-white/3 border border-white/6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-slate-400">Split Details</p>
                  <Badge variant="outline" size="sm">
                    {splitTypeConfig[expense.splitType].label}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {expense.splits.map((split) => {
                    const user = MOCK_USERS.find((u) => u.id === split.userId);
                    if (!user) return null;
                    return (
                      <div key={split.userId} className="flex items-center gap-2">
                        <Avatar name={user.name} size="xs" />
                        <span className="text-xs text-slate-300 flex-1">{user.name}</span>
                        <span className={cn("text-xs font-semibold", split.isPaid ? "text-emerald-400" : "text-amber-400")}>
                          {formatCurrency(split.amount, "INR")}
                        </span>
                        <Badge variant={split.isPaid ? "success" : "warning"} size="sm">
                          {split.isPaid ? "Paid" : "Pending"}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* Paid by */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Paid by</span>
                <div className="flex items-center gap-1.5">
                  <Avatar name={paidByUser?.name ?? "?"} size="xs" />
                  <span className="text-slate-300 font-medium">{paidByUser?.name}</span>
                </div>
              </div>
              {expense.isRecurring && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Next due</span>
                  <span className="text-sky-400 font-medium">{expense.nextDueDate ? formatDate(expense.nextDueDate) : "—"}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AddExpenseSheet({ onClose }: { onClose: () => void }) {
  const [splitType, setSplitType] = useState<SplitType>("equal");
  const [selectedGroup, setSelectedGroup] = useState(MOCK_GROUPS[0].id);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", bounce: 0.1 }}
        className="w-full max-w-lg bg-[#0d1128] border border-white/12 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-[#0d1128] border-b border-white/8 flex items-center justify-between px-5 py-4">
          <h2 className="text-lg font-bold text-white">Add Expense</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Amount */}
          <div className="text-center py-4">
            <p className="text-slate-500 text-sm mb-2">Total Amount</p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-3xl text-slate-400">₹</span>
              <input
                type="number"
                placeholder="0"
                className="text-5xl font-black text-white bg-transparent outline-none w-40 text-center"
              />
            </div>
          </div>

          {/* Title & Group */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Description</label>
            <input className="input-glass" placeholder="What was it for?" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Group</label>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="input-glass"
              >
                {MOCK_GROUPS.map((g) => (
                  <option key={g.id} value={g.id} className="bg-[#0d1128]">{g.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Category</label>
              <select className="input-glass">
                {Object.entries(categoryMeta).map(([key, val]) => (
                  <option key={key} value={key} className="bg-[#0d1128]">{val.emoji} {key}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Split type */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">Split Type</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(splitTypeConfig).map(([key, val]) => {
                const Icon = val.icon;
                return (
                  <button
                    key={key}
                    onClick={() => setSplitType(key as SplitType)}
                    className={cn(
                      "flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all",
                      splitType === key
                        ? "border-sky-500/40 bg-sky-500/10 text-sky-400"
                        : "border-white/8 bg-white/3 text-slate-400 hover:border-white/15"
                    )}
                  >
                    <Icon size={16} />
                    <div>
                      <p className="text-xs font-semibold">{val.label}</p>
                      <p className="text-[10px] opacity-70">{val.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Receipt scan */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-violet-500/8 border border-violet-500/20">
            <Camera className="w-5 h-5 text-violet-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-violet-400">Scan Receipt with AI</p>
              <p className="text-[11px] text-slate-500">Auto-detect amount, merchant & category</p>
            </div>
            <Button size="xs" variant="secondary">Scan</Button>
          </div>

          {/* Recurring toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/4">
            <div className="flex items-center gap-2">
              <RefreshCw size={15} className="text-slate-400" />
              <span className="text-sm text-slate-300 font-medium">Recurring expense</span>
            </div>
            <button className="w-10 h-5 rounded-full bg-white/15 relative transition-all">
              <div className="absolute left-1 top-0.5 w-4 h-4 rounded-full bg-white/60 transition-all" />
            </button>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Tags</label>
            <div className="flex items-center gap-2 flex-wrap">
              {["rent", "monthly", "shared"].map((tag) => (
                <span key={tag} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/8 text-xs text-slate-300 border border-white/10">
                  <Tag size={10} />
                  {tag}
                  <X size={10} className="cursor-pointer hover:text-white" />
                </span>
              ))}
              <input placeholder="+ Add tag" className="text-xs text-slate-400 bg-transparent outline-none w-20" />
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-[#0d1128] border-t border-white/8 p-5 flex gap-3">
          <Button variant="secondary" fullWidth onClick={onClose}>Cancel</Button>
          <Button fullWidth leftIcon={<Receipt size={15} />} onClick={onClose}>
            Add Expense
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function ExpensesPage() {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const filtered = MOCK_EXPENSES.filter((e) => {
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "all" || e.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const totalThisMonth = MOCK_EXPENSES.reduce((s, e) => s + e.amount, 0);
  const myTotalOwed = MOCK_EXPENSES.flatMap((e) => e.splits)
    .filter((s) => s.userId === CURRENT_USER.id && !s.isPaid)
    .reduce((sum, s) => sum + s.amount, 0);

  return (
    <>
      <AnimatePresence>{showAdd && <AddExpenseSheet onClose={() => setShowAdd(false)} />}</AnimatePresence>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <h1 className="text-2xl font-black text-white">Expenses</h1>
            <p className="text-slate-400 text-sm mt-0.5">Track and manage all shared expenses</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" leftIcon={<Camera size={15} />}>Scan Receipt</Button>
            <Button leftIcon={<Plus size={15} />} onClick={() => setShowAdd(true)}>Add Expense</Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total This Month", value: formatCurrency(totalThisMonth, "INR"), color: "text-white" },
            { label: "My Share Pending", value: formatCurrency(myTotalOwed, "INR"), color: "text-amber-400" },
            { label: "Expenses Count", value: String(MOCK_EXPENSES.length), color: "text-sky-400" },
            { label: "Recurring", value: String(MOCK_EXPENSES.filter((e) => e.isRecurring).length), color: "text-violet-400" },
          ].map((s, i) => (
            <Card key={i} padding="md">
              <p className={cn("text-xl font-bold mb-0.5", s.color)}>{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-glass pl-9"
              placeholder="Search expenses..."
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <Filter size={14} className="text-slate-500 flex-shrink-0" />
            {["all", "rent", "food", "subscriptions", "travel", "utilities"].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={cn(
                  "flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all capitalize",
                  categoryFilter === cat
                    ? "bg-sky-500/15 text-sky-400 border border-sky-500/25"
                    : "bg-white/5 text-slate-400 border border-white/8 hover:text-white"
                )}
              >
                {cat === "all" ? "All" : `${categoryMeta[cat as ExpenseCategory]?.emoji ?? ""} ${cat}`}
              </button>
            ))}
          </div>
        </div>

        {/* Expense list */}
        <Card padding="md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white">{filtered.length} expenses</h2>
            <select className="text-xs text-slate-400 bg-transparent outline-none border border-white/10 rounded-lg px-2 py-1">
              <option>Newest first</option>
              <option>Oldest first</option>
              <option>Highest amount</option>
            </select>
          </div>
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">No expenses found</p>
              <p className="text-slate-600 text-sm mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            filtered.map((expense) => <ExpenseRow key={expense.id} expense={expense} />)
          )}
        </Card>
      </div>
    </>
  );
}
