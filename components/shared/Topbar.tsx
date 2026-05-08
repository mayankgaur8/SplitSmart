"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Search,
  Menu,
  X,
  Plus,
  CheckCheck,
  ArrowLeftRight,
  Users,
  Receipt,
  CreditCard,
  Trophy,
  Zap,
} from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { CURRENT_USER, MOCK_NOTIFICATIONS } from "@/lib/mock-data";

const notifIcons: Record<string, React.ReactNode> = {
  payment_due: <ArrowLeftRight size={14} />,
  payment_received: <CheckCheck size={14} />,
  expense_added: <Receipt size={14} />,
  group_invite: <Users size={14} />,
  settlement_request: <ArrowLeftRight size={14} />,
  subscription_renewal: <CreditCard size={14} />,
  badge_earned: <Trophy size={14} />,
  streak_milestone: <Zap size={14} />,
};

interface TopbarProps {
  onMenuClick: () => void;
  title?: string;
}

export function Topbar({ onMenuClick, title }: TopbarProps) {
  const [showNotifs, setShowNotifs] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const unreadCount = MOCK_NOTIFICATIONS.filter((n) => !n.isRead).length;

  return (
    <header className="h-14 border-b border-white/8 flex items-center gap-3 px-4 bg-[#060914]/80 backdrop-blur-sm sticky top-0 z-30">
      {/* Mobile menu */}
      <button
        onClick={onMenuClick}
        className="lg:hidden text-slate-400 hover:text-white transition-colors p-1"
      >
        <Menu size={20} />
      </button>

      {/* Title */}
      {title && (
        <h1 className="text-base font-semibold text-white hidden sm:block">{title}</h1>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      <div className="relative">
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 220, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <input
                autoFocus
                placeholder="Search groups, expenses..."
                className="w-full h-8 px-3 pr-8 bg-white/8 border border-white/12 rounded-xl text-sm text-white placeholder:text-slate-500 outline-none focus:border-sky-500/50"
                onBlur={() => setShowSearch(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={() => setShowSearch(!showSearch)}
          className={cn(
            "absolute right-0 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors",
            showSearch ? "text-sky-400" : "text-slate-400 hover:text-white"
          )}
        >
          {showSearch ? <X size={16} /> : <Search size={16} />}
        </button>
      </div>

      {/* Quick add */}
      <Link
        href="/expenses/new"
        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-violet-500 text-white text-xs font-semibold hover:opacity-90 transition-opacity"
      >
        <Plus size={14} />
        <span>Add Expense</span>
      </Link>

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => setShowNotifs(!showNotifs)}
          className="relative p-2 rounded-xl hover:bg-white/8 text-slate-400 hover:text-white transition-colors"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-sky-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>

        <AnimatePresence>
          {showNotifs && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowNotifs(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-80 bg-[#0d1128] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
                  <span className="font-semibold text-white text-sm">Notifications</span>
                  <Badge variant="info">{unreadCount} new</Badge>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {MOCK_NOTIFICATIONS.map((notif) => (
                    <div
                      key={notif.id}
                      className={cn(
                        "flex items-start gap-3 px-4 py-3 hover:bg-white/4 transition-colors border-b border-white/4 last:border-0",
                        !notif.isRead && "bg-sky-500/4"
                      )}
                    >
                      <div
                        className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
                          !notif.isRead
                            ? "bg-sky-500/20 text-sky-400"
                            : "bg-white/8 text-slate-400"
                        )}
                      >
                        {notifIcons[notif.type]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-xs font-semibold", !notif.isRead ? "text-white" : "text-slate-300")}>
                          {notif.title}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                          {notif.body}
                        </p>
                        <p className="text-[10px] text-slate-600 mt-1">
                          {formatRelativeTime(notif.createdAt)}
                        </p>
                      </div>
                      {!notif.isRead && (
                        <div className="w-2 h-2 rounded-full bg-sky-500 flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t border-white/8">
                  <button className="w-full text-center text-xs text-sky-400 hover:text-sky-300 font-medium py-1">
                    Mark all as read
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* User avatar */}
      <Link href="/settings">
        <Avatar name={CURRENT_USER.name} size="sm" isOnline />
      </Link>
    </header>
  );
}
