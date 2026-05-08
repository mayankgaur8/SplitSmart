"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  TrendingUp, TrendingDown, Brain, Lightbulb,
  AlertTriangle, Star, DollarSign,
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { Card, StatCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { MONTHLY_SPEND, CATEGORY_BREAKDOWN, AI_INSIGHTS } from "@/lib/mock-data";

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; fill?: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0d1128] border border-white/12 rounded-xl p-3 shadow-xl text-xs">
      <p className="text-slate-400 font-medium mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ background: p.fill }} />
          <span className="text-slate-300">{p.name}:</span>
          <span className="text-white font-bold">{formatCurrency(p.value, "INR")}</span>
        </div>
      ))}
    </div>
  );
}

function PieTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0d1128] border border-white/12 rounded-xl p-3 shadow-xl text-xs">
      <p className="text-white font-bold">{payload[0].name}</p>
      <p className="text-slate-400">{formatCurrency(payload[0].value, "INR")}</p>
    </div>
  );
}

export function AnalyticsPage() {
  const [period, setPeriod] = useState<"3m" | "6m" | "1y">("6m");

  const totalSpend = MONTHLY_SPEND.reduce((s, m) => s + m.total, 0);
  const avgMonthly = Math.round(totalSpend / MONTHLY_SPEND.length);
  const lastMonth = MONTHLY_SPEND[MONTHLY_SPEND.length - 1].total;
  const prevMonth = MONTHLY_SPEND[MONTHLY_SPEND.length - 2].total;
  const monthChange = Math.round(((lastMonth - prevMonth) / prevMonth) * 100);

  const insightIconMap = {
    warning: AlertTriangle,
    saving: TrendingDown,
    recommendation: Lightbulb,
    achievement: Star,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h1 className="text-2xl font-black text-white">Analytics & Insights</h1>
          <p className="text-slate-400 text-sm mt-0.5">Deep dive into your spending patterns</p>
        </div>
        <div className="flex gap-1 p-1 rounded-xl bg-white/5">
          {(["3m", "6m", "1y"] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={cn("px-3 py-1.5 rounded-lg text-sm font-semibold transition-all",
                period === p ? "bg-white/15 text-white" : "text-slate-500 hover:text-slate-300"
              )}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Spent"
          value={formatCurrency(totalSpend, "INR")}
          change="Last 6 months"
          icon={<DollarSign size={18} />}
          iconColor="bg-sky-500/15 text-sky-400"
        />
        <StatCard
          title="Monthly Average"
          value={formatCurrency(avgMonthly, "INR")}
          change="Per month"
          icon={<TrendingUp size={18} />}
          iconColor="bg-violet-500/15 text-violet-400"
        />
        <StatCard
          title="This Month"
          value={formatCurrency(lastMonth, "INR")}
          change={`${monthChange > 0 ? "+" : ""}${monthChange}% vs last month`}
          changeType={monthChange > 0 ? "negative" : "positive"}
          icon={monthChange > 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
          iconColor={monthChange > 0 ? "bg-red-500/15 text-red-400" : "bg-emerald-500/15 text-emerald-400"}
        />
        <StatCard
          title="Biggest Category"
          value="Rent"
          change="44.6% of spend"
          icon={<Brain size={18} />}
          iconColor="bg-amber-500/15 text-amber-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main spend chart */}
        <div className="lg:col-span-2">
          <Card padding="md">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-white">Spending by Category</h2>
                <p className="text-xs text-slate-500">Monthly breakdown</p>
              </div>
              <Badge variant="default">Last 6 months</Badge>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={MONTHLY_SPEND} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: "#64748b" }} />
                  <Bar dataKey="rent" name="Rent" stackId="a" fill="#0ea5e9" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="food" name="Food" stackId="a" fill="#8b5cf6" />
                  <Bar dataKey="entertainment" name="Entertainment" stackId="a" fill="#ec4899" />
                  <Bar dataKey="subscriptions" name="Subscriptions" stackId="a" fill="#10b981" />
                  <Bar dataKey="other" name="Other" stackId="a" fill="#64748b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Trend chart */}
          <Card padding="md" className="mt-4">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-white">Spending Trend</h2>
                <p className="text-xs text-slate-500">Total monthly spend over time</p>
              </div>
            </div>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={MONTHLY_SPEND}>
                  <defs>
                    <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="total" name="Total" stroke="#8b5cf6" strokeWidth={2} fill="url(#totalGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Pie chart */}
          <Card padding="md">
            <h2 className="text-sm font-bold text-white mb-4">Category Breakdown</h2>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={CATEGORY_BREAKDOWN} cx="50%" cy="50%" innerRadius={40} outerRadius={65}
                    dataKey="amount" paddingAngle={3}>
                    {CATEGORY_BREAKDOWN.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-3">
              {CATEGORY_BREAKDOWN.map((cat) => (
                <div key={cat.category} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                  <span className="text-xs text-slate-400 flex-1">{cat.category}</span>
                  <span className="text-xs font-semibold text-white">{cat.percentage}%</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Group comparison */}
          <Card padding="md">
            <h2 className="text-sm font-bold text-white mb-4">Group Spend</h2>
            <div className="space-y-3">
              {[
                { name: "Koramangala Flat", amount: 128400, total: 200000, color: "blue" as const },
                { name: "Goa Trip", amount: 42000, total: 50000, color: "purple" as const },
                { name: "OTT Pool", amount: 4800, total: 5000, color: "green" as const },
                { name: "Startup Office", amount: 84000, total: 100000, color: "orange" as const },
              ].map((g, i) => (
                <div key={i}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-slate-400">{g.name}</span>
                    <span className="text-xs font-bold text-white">{formatCurrency(g.amount, "INR")}</span>
                  </div>
                  <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(g.amount / g.total) * 100}%` }}
                      transition={{ delay: i * 0.1, duration: 0.8 }}
                      className={cn("h-full rounded-full", {
                        "bg-sky-500": g.color === "blue",
                        "bg-violet-500": g.color === "purple",
                        "bg-emerald-500": g.color === "green",
                        "bg-amber-500": g.color === "orange",
                      })}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* AI Insights section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-violet-400" />
          <h2 className="text-base font-bold text-white">AI Financial Insights</h2>
          <Badge variant="purple">Personalized</Badge>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {AI_INSIGHTS.map((insight, i) => {
            const InsightIcon = insightIconMap[insight.type];
            const config = {
              warning: "bg-amber-500/8 border-amber-500/20 text-amber-400",
              saving: "bg-emerald-500/8 border-emerald-500/20 text-emerald-400",
              recommendation: "bg-violet-500/8 border-violet-500/20 text-violet-400",
              achievement: "bg-sky-500/8 border-sky-500/20 text-sky-400",
            }[insight.type];
            const [bg, border, textColor] = config.split(" ");
            return (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={cn("p-4 rounded-2xl border", bg, border)}
              >
                <div className="flex items-start gap-3">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", bg, "border", border)}>
                    <InsightIcon className={cn("w-4 h-4", textColor)} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-bold text-white">{insight.title}</p>
                      {insight.savingAmount && (
                        <Badge variant="success" size="sm">
                          Save {formatCurrency(insight.savingAmount, "INR")}/mo
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{insight.description}</p>
                    {insight.actionLabel && (
                      <button className={cn("text-xs font-bold mt-2 hover:opacity-80", textColor)}>
                        {insight.actionLabel} →
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
