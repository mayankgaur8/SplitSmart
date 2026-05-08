"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Receipt,
  CreditCard,
  ArrowLeftRight,
  Trophy,
  BarChart3,
  Settings,
  Shield,
  Zap,
  X,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { CURRENT_USER } from "@/lib/mock-data";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Groups",
    href: "/groups",
    icon: Users,
  },
  {
    label: "Expenses",
    href: "/expenses",
    icon: Receipt,
  },
  {
    label: "Subscriptions",
    href: "/subscriptions",
    icon: CreditCard,
  },
  {
    label: "Settlements",
    href: "/settlements",
    icon: ArrowLeftRight,
    badge: "2",
  },
  {
    label: "Rewards",
    href: "/gamification",
    icon: Trophy,
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
];

const bottomItems = [
  { label: "Admin Panel", href: "/admin", icon: Shield },
  { label: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isMobile?: boolean;
}

function NavItem({
  item,
  isActive,
  collapsed,
}: {
  item: (typeof navItems)[0];
  isActive: boolean;
  collapsed?: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group relative",
        isActive
          ? "bg-sky-500/15 text-sky-400"
          : "text-slate-400 hover:text-white hover:bg-white/6"
      )}
    >
      {isActive && (
        <motion.div
          layoutId="sidebar-active"
          className="absolute inset-0 rounded-xl bg-sky-500/15 border border-sky-500/20"
          transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
        />
      )}
      <Icon
        className={cn(
          "w-4.5 h-4.5 flex-shrink-0 relative z-10",
          isActive ? "text-sky-400" : "text-slate-500 group-hover:text-white"
        )}
        size={18}
      />
      {!collapsed && (
        <span className="text-sm font-medium relative z-10 truncate">
          {item.label}
        </span>
      )}
      {!collapsed && "badge" in item && item.badge && (
        <Badge variant="info" className="ml-auto relative z-10">
          {item.badge}
        </Badge>
      )}
    </Link>
  );
}

export function Sidebar({ isOpen = true, onClose, isMobile }: SidebarProps) {
  const pathname = usePathname();

  const content = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-white/6">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-violet-500 flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-bold text-white text-sm">SplitSmart</span>
            <p className="text-[10px] text-slate-500 font-medium">Money OS</p>
          </div>
        </Link>
        {isMobile && (
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Plan badge */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-sky-500/10 to-violet-500/10 border border-sky-500/15">
          <Zap className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
          <span className="text-xs font-semibold text-sky-400">Pro Plan Active</span>
          <ChevronRight className="w-3 h-3 text-sky-400/60 ml-auto" />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavItem
            key={item.href}
            item={item}
            isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
          />
        ))}
      </nav>

      {/* Bottom section */}
      <div className="px-3 py-2 border-t border-white/6 space-y-0.5">
        {bottomItems.map((item) => (
          <NavItem key={item.href} item={item} isActive={pathname === item.href} />
        ))}
      </div>

      {/* User profile */}
      <div className="p-4 border-t border-white/6">
        <Link href="/settings" className="flex items-center gap-3 group">
          <Avatar
            name={CURRENT_USER.name}
            size="sm"
            isOnline
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {CURRENT_USER.name}
            </p>
            <p className="text-[11px] text-slate-500 truncate">
              {CURRENT_USER.email}
            </p>
          </div>
          <div className="flex flex-col items-end flex-shrink-0">
            <span className="text-xs font-bold text-sky-400">
              {CURRENT_USER.reputationScore}
            </span>
            <span className="text-[10px] text-slate-500">score</span>
          </div>
        </Link>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={onClose}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", bounce: 0, duration: 0.35 }}
              className="fixed left-0 top-0 bottom-0 w-72 z-50 bg-[#0a0d1f] border-r border-white/8"
            >
              {content}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    );
  }

  return (
    <aside className="w-64 h-full bg-[#0a0d1f] border-r border-white/8 flex-shrink-0 hidden lg:block">
      {content}
    </aside>
  );
}
