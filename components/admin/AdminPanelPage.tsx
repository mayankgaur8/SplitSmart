"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Users, TrendingUp, DollarSign, Activity, Shield,
  AlertTriangle, CheckCircle, Clock, Crown, Zap,
  BarChart2, UserX, Eye, Search,
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { Card, StatCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ADMIN_STATS, REVENUE_DATA, MOCK_USERS } from "@/lib/mock-data";

const planColors = {
  free: "default" as const,
  pro: "info" as const,
  team: "purple" as const,
};

function RevenueTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0d1128] border border-white/12 rounded-xl p-3 shadow-xl text-xs">
      <p className="text-slate-400 font-medium mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 mb-1">
          <span className="text-slate-300">{p.name}:</span>
          <span className="text-white font-bold">{formatCurrency(p.value, "INR")}</span>
        </div>
      ))}
    </div>
  );
}

export function AdminPanelPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "revenue" | "security">("overview");

  const mrrGrowth = Math.round(((ADMIN_STATS.mrr - REVENUE_DATA[REVENUE_DATA.length - 2].mrr) / REVENUE_DATA[REVENUE_DATA.length - 2].mrr) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-sky-400" />
            <h1 className="text-2xl font-black text-white">Admin Panel</h1>
            <Badge variant="danger" size="sm">Admin Only</Badge>
          </div>
          <p className="text-slate-400 text-sm mt-0.5">Platform health, revenue, and user management</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">Last updated</p>
          <p className="text-sm text-white font-semibold">Just now</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/5 w-fit overflow-x-auto">
        {(["overview", "users", "revenue", "security"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={cn("flex-shrink-0 px-4 py-2 rounded-lg text-sm font-semibold transition-all capitalize",
              activeTab === tab ? "bg-white/15 text-white" : "text-slate-500 hover:text-slate-300"
            )}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* KPI grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Users" value={ADMIN_STATS.totalUsers.toLocaleString()}
              change={`${ADMIN_STATS.activeUsers.toLocaleString()} active`} changeType="positive"
              icon={<Users size={18} />} iconColor="bg-sky-500/15 text-sky-400" />
            <StatCard title="MRR" value={formatCurrency(ADMIN_STATS.mrr, "INR")}
              change={`+${mrrGrowth}% vs last month`} changeType="positive"
              icon={<DollarSign size={18} />} iconColor="bg-emerald-500/15 text-emerald-400" />
            <StatCard title="Pro Users" value={ADMIN_STATS.proUsers.toLocaleString()}
              change={`${Math.round(ADMIN_STATS.proUsers / ADMIN_STATS.totalUsers * 100)}% conversion`}
              icon={<Crown size={18} />} iconColor="bg-amber-500/15 text-amber-400" />
            <StatCard title="Churn Rate" value={`${ADMIN_STATS.churnRate}%`}
              change="Within healthy range" changeType="positive"
              icon={<Activity size={18} />} iconColor="bg-violet-500/15 text-violet-400" />
          </div>

          {/* MRR chart */}
          <Card padding="md">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-white">Monthly Recurring Revenue</h2>
                <p className="text-xs text-slate-500">6-month trajectory</p>
              </div>
              <Badge variant="success">+{mrrGrowth}% MoM</Badge>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={REVENUE_DATA}>
                  <defs>
                    <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip content={<RevenueTooltip />} />
                  <Area type="monotone" dataKey="mrr" name="MRR" stroke="#10b981" strokeWidth={2} fill="url(#mrrGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Revenue waterfall */}
          <Card padding="md">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-white">Revenue Breakdown</h2>
              <select className="text-xs text-slate-400 bg-transparent outline-none border border-white/10 rounded-lg px-2 py-1">
                <option>Last 6 months</option>
                <option>Last year</option>
              </select>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={REVENUE_DATA}>
                  <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip content={<RevenueTooltip />} />
                  <Bar dataKey="newRevenue" name="New" fill="#0ea5e9" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="churned" name="Churned" fill="#ef4444" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Quick metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Transactions", value: ADMIN_STATS.totalTransactions.toLocaleString(), icon: Activity, color: "text-sky-400" },
              { label: "Total Groups", value: ADMIN_STATS.totalGroups.toLocaleString(), icon: Users, color: "text-violet-400" },
              { label: "NPS Score", value: String(ADMIN_STATS.nps), icon: TrendingUp, color: "text-emerald-400" },
              { label: "Team Plan Users", value: String(ADMIN_STATS.teamUsers), icon: Crown, color: "text-amber-400" },
            ].map((m, i) => (
              <Card key={i} padding="md">
                <m.icon className={cn("w-5 h-5 mb-2", m.color)} />
                <p className="text-xl font-black text-white">{m.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{m.label}</p>
              </Card>
            ))}
          </div>
        </motion.div>
      )}

      {activeTab === "users" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          {/* User search */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input className="input-glass pl-9" placeholder="Search users by name, email..." />
            </div>
            <select className="input-glass w-40">
              <option>All Plans</option>
              <option>Free</option>
              <option>Pro</option>
              <option>Team</option>
            </select>
          </div>

          {/* User table */}
          <Card padding="none">
            <div className="p-4 border-b border-white/8">
              <h2 className="text-sm font-bold text-white">User Management</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/6">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Plan</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Score</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Paid</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Joined</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_USERS.map((user) => (
                    <tr key={user.id} className="border-b border-white/4 hover:bg-white/3 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={user.name} size="sm" isOnline={user.isOnline} />
                          <div>
                            <p className="text-white font-medium text-xs">{user.name}</p>
                            <p className="text-slate-500 text-[11px]">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={planColors[user.plan]} size="sm" className="capitalize">{user.plan}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <ProgressBar value={user.reputationScore} className="w-16" size="xs" />
                          <span className="text-xs text-slate-300 font-semibold">{user.reputationScore}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-white">
                        {formatCurrency(user.totalPaid, "INR")}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {new Date(user.joinedAt).toLocaleDateString("en", { month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all">
                            <Eye size={13} />
                          </button>
                          <button className="p-1.5 rounded-lg hover:bg-red-500/15 text-slate-400 hover:text-red-400 transition-all">
                            <UserX size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      )}

      {activeTab === "revenue" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card padding="md">
              <h2 className="text-base font-bold text-white mb-4">Revenue by Plan</h2>
              <div className="space-y-4">
                {[
                  { plan: "Team Plan", users: ADMIN_STATS.teamUsers, price: 999, color: "purple" as const },
                  { plan: "Pro Plan", users: ADMIN_STATS.proUsers, price: 299, color: "info" as const },
                  { plan: "Free Plan", users: ADMIN_STATS.totalUsers - ADMIN_STATS.proUsers - ADMIN_STATS.teamUsers, price: 0, color: "default" as const },
                ].map((p, i) => {
                  const rev = p.users * p.price;
                  const pct = ADMIN_STATS.mrr > 0 ? Math.round((rev / ADMIN_STATS.mrr) * 100) : 0;
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <Badge variant={p.color} size="sm">{p.plan}</Badge>
                          <span className="text-xs text-slate-500">{p.users.toLocaleString()} users</span>
                        </div>
                        <span className="text-xs font-bold text-white">{formatCurrency(rev, "INR")}/mo</span>
                      </div>
                      <ProgressBar value={pct} color={i === 0 ? "purple" : i === 1 ? "blue" : "gradient"} size="sm" showLabel />
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card padding="md">
              <h2 className="text-base font-bold text-white mb-4">MRR Growth</h2>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={REVENUE_DATA}>
                    <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip content={<RevenueTooltip />} />
                    <Line type="monotone" dataKey="mrr" name="MRR" stroke="#10b981" strokeWidth={2.5} dot={{ fill: "#10b981", r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </motion.div>
      )}

      {activeTab === "security" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          {/* Security alerts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Active Alerts", value: "3", icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
              { label: "Resolved Today", value: "12", icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
              { label: "Under Review", value: "5", icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
            ].map((item, i) => (
              <Card key={i} className={`border ${item.bg}`} padding="md">
                <div className="flex items-center gap-3">
                  <item.icon className={cn("w-5 h-5", item.color)} />
                  <div>
                    <p className={cn("text-2xl font-black", item.color)}>{item.value}</p>
                    <p className="text-xs text-slate-400">{item.label}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Fraud alerts table */}
          <Card padding="none">
            <div className="p-4 border-b border-white/8 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-red-400" />
                <h2 className="text-sm font-bold text-white">Fraud Detection Alerts</h2>
              </div>
              <Badge variant="danger">3 active</Badge>
            </div>
            {[
              { user: "Unknown Device", email: "suspicious@temp.com", reason: "Multiple accounts from same IP", severity: "high", time: "2h ago" },
              { user: "Rahul Mehta", email: "rahul@example.com", reason: "Unusual payment pattern detected", severity: "medium", time: "5h ago" },
              { user: "New User", email: "new.user@proton.me", reason: "Payment reversal attempt", severity: "low", time: "1d ago" },
            ].map((alert, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-white/4 last:border-0">
                <div className={cn("w-2 h-2 rounded-full flex-shrink-0",
                  alert.severity === "high" ? "bg-red-400" :
                  alert.severity === "medium" ? "bg-amber-400" : "bg-yellow-400"
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white">{alert.user}</p>
                  <p className="text-[11px] text-slate-500 truncate">{alert.reason}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] text-slate-600">{alert.time}</span>
                  <Badge variant={alert.severity === "high" ? "danger" : alert.severity === "medium" ? "warning" : "default"} size="sm">
                    {alert.severity}
                  </Badge>
                  <button className="text-xs text-sky-400 hover:text-sky-300 font-medium">Review</button>
                </div>
              </div>
            ))}
          </Card>

          {/* Audit log */}
          <Card padding="none">
            <div className="p-4 border-b border-white/8">
              <h2 className="text-sm font-bold text-white">Recent Audit Log</h2>
            </div>
            {[
              { action: "User plan upgraded", user: "Priya Sharma", detail: "Free → Pro", time: "10m ago", type: "success" },
              { action: "Admin login", user: "Mayank Gaur", detail: "IP: 103.xx.xx.xx", time: "1h ago", type: "info" },
              { action: "Payment failed", user: "Rahul Mehta", detail: "₹20,000 UPI failed", time: "3h ago", type: "warning" },
              { action: "Group deleted", user: "Karan Singh", detail: "Group: Weekend Trip", time: "6h ago", type: "default" },
            ].map((log, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-white/4 last:border-0">
                <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0",
                  log.type === "success" ? "bg-emerald-400" :
                  log.type === "info" ? "bg-sky-400" :
                  log.type === "warning" ? "bg-amber-400" : "bg-slate-500"
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white">{log.action}</p>
                  <p className="text-[11px] text-slate-500">{log.user} · {log.detail}</p>
                </div>
                <span className="text-[10px] text-slate-600 flex-shrink-0">{log.time}</span>
              </div>
            ))}
          </Card>
        </motion.div>
      )}
    </div>
  );
}
