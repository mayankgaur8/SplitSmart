"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, Users, Copy, Check, MoreVertical,
  Crown, Shield, UserPlus, ExternalLink, Archive,
  Plane, Home, Tv, Briefcase, Heart,
} from "lucide-react";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar, AvatarGroup } from "@/components/ui/Avatar";
import { MOCK_GROUPS, CURRENT_USER } from "@/lib/mock-data";
import type { Group } from "@/lib/types";

const categoryConfig = {
  flatmates: { icon: Home, label: "Flatmates", color: "from-sky-500 to-cyan-500" },
  travel: { icon: Plane, label: "Travel", color: "from-violet-500 to-pink-500" },
  friends: { icon: Users, label: "Friends", color: "from-emerald-500 to-teal-500" },
  couple: { icon: Heart, label: "Couple", color: "from-pink-500 to-rose-500" },
  family: { icon: Home, label: "Family", color: "from-amber-500 to-orange-500" },
  team: { icon: Briefcase, label: "Team", color: "from-indigo-500 to-violet-500" },
  subscriptions: { icon: Tv, label: "Subscriptions", color: "from-red-500 to-pink-500" },
  other: { icon: Users, label: "Other", color: "from-slate-500 to-slate-400" },
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await navigator.clipboard.writeText(text).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all"
    >
      {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
    </button>
  );
}

function GroupCard({ group }: { group: Group }) {
  const cat = categoryConfig[group.category];
  const CatIcon = cat.icon;
  const myMember = group.members.find((m) => m.userId === CURRENT_USER.id);
  const balance = myMember?.balance ?? 0;
  const isOwed = balance > 0;
  const isOwner = myMember?.role === "owner";

  return (
    <Card hover glow="blue" className="group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center flex-shrink-0`}>
            <CatIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-white font-bold text-sm">{group.name}</h3>
              {isOwner && <Crown size={12} className="text-amber-400" />}
            </div>
            <p className="text-slate-500 text-xs mt-0.5">{group.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <CopyButton text={`https://app.splitsmart.io/join/${group.inviteCode}`} />
          <button className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all">
            <MoreVertical size={14} />
          </button>
        </div>
      </div>

      {/* Balance */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-white/4 mb-4">
        <span className="text-xs text-slate-500">Your balance</span>
        <span className={cn("text-base font-bold", balance === 0 ? "text-slate-300" : isOwed ? "text-emerald-400" : "text-red-400")}>
          {balance === 0 ? "All settled" : `${isOwed ? "+" : ""}${formatCurrency(balance, "INR")}`}
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-4 text-center">
        <div>
          <p className="text-base font-bold text-white">{group.members.length}</p>
          <p className="text-[10px] text-slate-500">Members</p>
        </div>
        <div>
          <p className="text-base font-bold text-white">{formatCurrency(group.totalExpenses, "INR").replace("₹", "₹")}</p>
          <p className="text-[10px] text-slate-500">Total spent</p>
        </div>
        <div>
          <p className="text-base font-bold text-white">{formatDate(group.createdAt)}</p>
          <p className="text-[10px] text-slate-500">Created</p>
        </div>
      </div>

      {/* Members */}
      <div className="flex items-center justify-between">
        <AvatarGroup users={group.members.map((m) => ({ name: m.user.name }))} max={4} size="sm" />
        <div className="flex items-center gap-1">
          <Badge variant={isOwed ? "success" : balance < 0 ? "danger" : "default"} size="sm">
            {cat.label}
          </Badge>
        </div>
      </div>

      {/* Invite code */}
      <div className="mt-3 flex items-center gap-2 p-2.5 rounded-xl bg-white/4 border border-white/6">
        <ExternalLink size={12} className="text-slate-500 flex-shrink-0" />
        <span className="text-[11px] text-slate-500 flex-1 truncate">
          Invite: <span className="text-slate-300 font-mono">{group.inviteCode}</span>
        </span>
        <CopyButton text={group.inviteCode} />
      </div>
    </Card>
  );
}

function CreateGroupModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState("flatmates");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="w-full max-w-md bg-[#0d1128] border border-white/12 rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-white/8">
          <h2 className="text-lg font-bold text-white">Create a New Group</h2>
          <p className="text-slate-500 text-sm mt-0.5">Step {step} of 2</p>
        </div>

        <div className="p-5">
          {step === 1 ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Group Name</label>
                <input className="input-glass" placeholder="e.g. Koramangala Flat 2024" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Category</label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(categoryConfig).slice(0, 8).map(([key, val]) => {
                    const Icon = val.icon;
                    return (
                      <button
                        key={key}
                        onClick={() => setSelected(key)}
                        className={cn(
                          "flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs transition-all",
                          selected === key
                            ? "border-sky-500/50 bg-sky-500/10 text-sky-400"
                            : "border-white/8 bg-white/3 text-slate-500 hover:border-white/15"
                        )}
                      >
                        <Icon size={16} />
                        <span>{val.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Description (optional)</label>
                <input className="input-glass" placeholder="Brief description" />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Invite Members</label>
                <div className="flex gap-2">
                  <input className="input-glass flex-1" placeholder="Email or phone number" />
                  <Button size="sm" leftIcon={<UserPlus size={14} />}>Add</Button>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-sky-500/8 border border-sky-500/20">
                <p className="text-xs text-sky-400 font-medium mb-1">Share invite link</p>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value="https://app.splitsmart.io/join/NEW2024"
                    className="flex-1 text-xs text-slate-400 bg-transparent outline-none"
                  />
                  <CopyButton text="https://app.splitsmart.io/join/NEW2024" />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-white/8 flex gap-3">
          <Button variant="secondary" fullWidth onClick={step === 1 ? onClose : () => setStep(1)}>
            {step === 1 ? "Cancel" : "Back"}
          </Button>
          <Button fullWidth onClick={() => step === 1 ? setStep(2) : onClose()}>
            {step === 1 ? "Next" : "Create Group"}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function GroupsPage() {
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState<"all" | "owned" | "member">("all");

  const filtered = MOCK_GROUPS.filter((g) => {
    const matchSearch = g.name.toLowerCase().includes(search.toLowerCase());
    if (filter === "owned") return matchSearch && g.createdBy === CURRENT_USER.id;
    if (filter === "member") return matchSearch && g.createdBy !== CURRENT_USER.id;
    return matchSearch;
  });

  return (
    <>
      <AnimatePresence>
        {showCreate && <CreateGroupModal onClose={() => setShowCreate(false)} />}
      </AnimatePresence>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <h1 className="text-2xl font-black text-white">Groups</h1>
            <p className="text-slate-400 text-sm mt-0.5">Manage your shared expense groups</p>
          </div>
          <Button leftIcon={<Plus size={15} />} onClick={() => setShowCreate(true)}>
            New Group
          </Button>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Groups", value: MOCK_GROUPS.length, icon: Users, color: "text-sky-400" },
            { label: "Total Owed to You", value: formatCurrency(32400, "INR"), icon: Shield, color: "text-emerald-400" },
            { label: "You Owe", value: formatCurrency(8200, "INR"), icon: Crown, color: "text-red-400" },
          ].map((s, i) => (
            <Card key={i} padding="md">
              <div className="flex items-center gap-3">
                <s.icon className={cn("w-5 h-5", s.color)} />
                <div>
                  <p className="text-lg font-bold text-white">{s.value}</p>
                  <p className="text-xs text-slate-500">{s.label}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Filters + search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-glass pl-9"
              placeholder="Search groups..."
            />
          </div>
          <div className="flex gap-2">
            {(["all", "owned", "member"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize",
                  filter === f
                    ? "bg-sky-500/15 text-sky-400 border border-sky-500/25"
                    : "bg-white/5 text-slate-400 border border-white/8 hover:text-white"
                )}
              >
                {f === "all" ? "All" : f === "owned" ? "Created by me" : "I'm a member"}
              </button>
            ))}
          </div>
        </div>

        {/* Group cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((g, i) => (
            <motion.div
              key={g.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
            >
              <GroupCard group={g} />
            </motion.div>
          ))}
          {/* Create new */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: filtered.length * 0.07 }}
          >
            <button
              onClick={() => setShowCreate(true)}
              className="w-full h-full min-h-[200px] rounded-2xl border-2 border-dashed border-white/12 flex flex-col items-center justify-center gap-3 hover:border-sky-500/40 hover:bg-sky-500/4 transition-all group"
            >
              <div className="w-12 h-12 rounded-2xl bg-white/6 border border-white/10 flex items-center justify-center group-hover:bg-sky-500/15 group-hover:border-sky-500/25 transition-all">
                <Plus className="w-5 h-5 text-slate-400 group-hover:text-sky-400 transition-colors" />
              </div>
              <span className="text-sm text-slate-500 group-hover:text-sky-400 font-medium transition-colors">
                Create new group
              </span>
            </button>
          </motion.div>
        </div>
      </div>
    </>
  );
}
