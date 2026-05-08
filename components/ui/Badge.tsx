"use client";

import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "purple" | "outline";
  size?: "sm" | "md";
  className?: string;
  dot?: boolean;
}

const variantClasses = {
  default: "bg-white/10 text-white/70 border-white/10",
  success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  warning: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  danger: "bg-red-500/15 text-red-400 border-red-500/20",
  info: "bg-sky-500/15 text-sky-400 border-sky-500/20",
  purple: "bg-violet-500/15 text-violet-400 border-violet-500/20",
  outline: "bg-transparent text-white/60 border-white/15",
};

const dotColors = {
  default: "bg-white/40",
  success: "bg-emerald-400",
  warning: "bg-amber-400",
  danger: "bg-red-400",
  info: "bg-sky-400",
  purple: "bg-violet-400",
  outline: "bg-white/40",
};

export function Badge({
  children,
  variant = "default",
  size = "sm",
  className,
  dot,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-semibold border rounded-full",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-xs",
        variantClasses[variant],
        className
      )}
    >
      {dot && (
        <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", dotColors[variant])} />
      )}
      {children}
    </span>
  );
}
