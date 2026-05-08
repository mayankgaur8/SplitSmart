"use client";

import { motion } from "framer-motion";
import {
  Flame, Trophy, Star, Zap, Crown, Shield,
  TrendingUp, Award, Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Avatar } from "@/components/ui/Avatar";
import { CURRENT_USER, ALL_BADGES, MOCK_LEADERBOARD } from "@/lib/mock-data";

const rarityConfig = {
  common: { color: "border-slate-500/40 bg-slate-500/10", label: "Common", glow: "" },
  rare: { color: "border-sky-500/40 bg-sky-500/10", label: "Rare", glow: "shadow-[0_0_15px_rgba(14,165,233,0.15)]" },
  epic: { color: "border-violet-500/40 bg-violet-500/10", label: "Epic", glow: "shadow-[0_0_15px_rgba(139,92,246,0.2)]" },
  legendary: { color: "border-amber-500/40 bg-amber-500/10", label: "Legendary", glow: "shadow-[0_0_20px_rgba(245,158,11,0.25)]" },
};

const rankIcons: Record<number, React.ReactNode> = {
  1: <Crown className="w-4 h-4 text-amber-400" />,
  2: <Trophy className="w-4 h-4 text-slate-300" />,
  3: <Award className="w-4 h-4 text-amber-600" />,
};

export function GamificationPage() {
  const earnedBadgeIds = new Set(CURRENT_USER.badges);
  const nextLevelScore = 100;
  const levelProgress = CURRENT_USER.reputationScore;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white">Rewards & Reputation</h1>
        <p className="text-slate-400 text-sm mt-0.5">Build your payment reputation, earn badges, and climb the leaderboard</p>
      </div>

      {/* Hero score card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-500/15 via-violet-500/10 to-pink-500/10 border border-sky-500/20 p-6"
      >
        <div className="orb w-64 h-64 bg-sky-500 -top-20 -right-20" />
        <div className="orb w-48 h-48 bg-violet-500 bottom-0 left-0" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
          {/* Score ring */}
          <div className="relative w-24 h-24 flex-shrink-0">
            <svg viewBox="0 0 96 96" className="w-full h-full -rotate-90">
              <circle cx="48" cy="48" r="42" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
              <circle
                cx="48" cy="48" r="42" fill="none"
                stroke="url(#heroGrad)" strokeWidth="8"
                strokeDasharray={`${(levelProgress / nextLevelScore) * 263.9} 263.9`}
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="heroGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#0ea5e9" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-white">{CURRENT_USER.reputationScore}</span>
              <span className="text-[10px] text-slate-400">/ 100</span>
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
              <h2 className="text-xl font-black text-white">{CURRENT_USER.name}</h2>
              <Badge variant="info" size="sm">Top 8%</Badge>
            </div>
            <p className="text-sky-400 font-semibold mb-3">Reliable Payer · Pro Member</p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xl font-black text-white">{CURRENT_USER.paymentStreak}</p>
                <p className="text-xs text-slate-500">Day Streak 🔥</p>
              </div>
              <div>
                <p className="text-xl font-black text-white">{CURRENT_USER.badges.length}</p>
                <p className="text-xs text-slate-500">Badges Earned</p>
              </div>
              <div>
                <p className="text-xl font-black text-white">#2</p>
                <p className="text-xs text-slate-500">Global Rank</p>
              </div>
            </div>
          </div>

          {/* Streak flame */}
          <div className="flex-shrink-0">
            <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <Flame className="w-8 h-8 text-amber-400 float" />
              <span className="text-2xl font-black text-amber-400">{CURRENT_USER.paymentStreak}</span>
              <span className="text-xs text-amber-600 font-semibold">DAY STREAK</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Level progress */}
      <Card padding="md">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-bold text-white">Level Progress</p>
            <p className="text-xs text-slate-500">Reach 95 to unlock Reputation Master</p>
          </div>
          <Badge variant="purple" size="sm">Level 4 — Reliable</Badge>
        </div>
        <ProgressBar value={levelProgress} max={nextLevelScore} color="gradient" size="md" showLabel />
        <div className="flex justify-between mt-2 text-xs text-slate-500">
          <span>Level 4</span>
          <span>{nextLevelScore - levelProgress} pts to Level 5</span>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Badges */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white">Badges</h2>
            <span className="text-xs text-slate-500">{CURRENT_USER.badges.length}/{ALL_BADGES.length} earned</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {ALL_BADGES.map((badge, i) => {
              const earned = earnedBadgeIds.has(badge.id);
              const rc = rarityConfig[badge.rarity];
              return (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className={cn(
                    "relative p-4 rounded-2xl border transition-all",
                    earned ? `${rc.color} ${rc.glow}` : "border-white/6 bg-white/3 opacity-50",
                    earned && "hover:scale-105 cursor-pointer"
                  )}
                >
                  {!earned && (
                    <div className="absolute top-2 right-2">
                      <Lock size={12} className="text-slate-600" />
                    </div>
                  )}
                  <div className="text-3xl mb-2">{badge.icon}</div>
                  <p className={cn("text-sm font-bold mb-0.5", earned ? "text-white" : "text-slate-500")}>
                    {badge.name}
                  </p>
                  <p className="text-[11px] text-slate-500 leading-relaxed mb-2">{badge.description}</p>
                  <div className="flex items-center justify-between">
                    <Badge
                      variant={
                        badge.rarity === "legendary" ? "warning" :
                        badge.rarity === "epic" ? "purple" :
                        badge.rarity === "rare" ? "info" : "default"
                      }
                      size="sm"
                    >
                      {rc.label}
                    </Badge>
                    {earned && badge.unlockedAt && (
                      <span className="text-[10px] text-slate-600">
                        {new Date(badge.unlockedAt).toLocaleDateString("en", { month: "short", day: "numeric" })}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Leaderboard */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white">Group Leaderboard</h2>
            <Badge variant="info" size="sm">This Month</Badge>
          </div>
          <Card padding="sm">
            {MOCK_LEADERBOARD.map((entry, i) => {
              const isMe = entry.user.id === CURRENT_USER.id;
              return (
                <motion.div
                  key={entry.user.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl mb-1 last:mb-0 transition-all",
                    isMe ? "bg-sky-500/10 border border-sky-500/20" : "hover:bg-white/4"
                  )}
                >
                  <div className="w-6 text-center flex-shrink-0">
                    {rankIcons[entry.rank] || (
                      <span className="text-sm font-bold text-slate-500">#{entry.rank}</span>
                    )}
                  </div>
                  <Avatar name={entry.user.name} size="sm" isOnline={entry.user.isOnline} />
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-xs font-semibold truncate", isMe ? "text-sky-400" : "text-white")}>
                      {isMe ? "You" : entry.user.name}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <Flame size={10} className="text-amber-400" />
                      <span className="text-[10px] text-slate-500">{entry.streak}d streak</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={cn("text-sm font-bold", isMe ? "text-sky-400" : "text-white")}>
                      {entry.score.toLocaleString()}
                    </p>
                    <div className="flex items-center gap-0.5 justify-end">
                      <TrendingUp size={9} className={cn(
                        entry.change === "up" ? "text-emerald-400" :
                        entry.change === "down" ? "text-red-400 rotate-180" :
                        "text-slate-500"
                      )} />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </Card>

          {/* Challenges */}
          <div className="mt-5">
            <h3 className="text-sm font-bold text-white mb-3">Monthly Challenges</h3>
            <div className="space-y-2">
              {[
                { title: "Pay 5 bills on time", progress: 4, max: 5, reward: "⚡ Instant Payer", done: false },
                { title: "Add 10 expenses", progress: 10, max: 10, reward: "📝 Logger", done: true },
                { title: "Invite 2 friends", progress: 1, max: 2, reward: "🦋 Socialite", done: false },
              ].map((c, i) => (
                <div key={i} className={cn("p-3 rounded-xl border transition-all", c.done ? "bg-emerald-500/8 border-emerald-500/20" : "bg-white/4 border-white/8")}>
                  <div className="flex items-center justify-between mb-2">
                    <p className={cn("text-xs font-semibold", c.done ? "text-emerald-400" : "text-white")}>{c.title}</p>
                    <span className="text-xs text-slate-500">{c.reward}</span>
                  </div>
                  <ProgressBar value={c.progress} max={c.max} color={c.done ? "green" : "gradient"} size="xs" />
                  <p className="text-[10px] text-slate-500 mt-1">{c.progress}/{c.max} {c.done ? "✓ Complete" : "remaining"}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
