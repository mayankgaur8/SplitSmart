"use client";

import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: "blue" | "purple" | "green" | "none";
  padding?: "none" | "sm" | "md" | "lg";
  onClick?: () => void;
}

const glowClasses = {
  blue: "hover:border-sky-500/30 hover:shadow-[0_8px_30px_rgba(14,165,233,0.12)]",
  purple: "hover:border-violet-500/30 hover:shadow-[0_8px_30px_rgba(139,92,246,0.12)]",
  green: "hover:border-emerald-500/30 hover:shadow-[0_8px_30px_rgba(16,185,129,0.12)]",
  none: "",
};

const paddingClasses = {
  none: "",
  sm: "p-3",
  md: "p-5",
  lg: "p-6",
};

export function Card({
  children,
  className,
  hover,
  glow = "none",
  padding = "md",
  onClick,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-2xl bg-[#0d1128]/80 border border-white/8 backdrop-blur-sm",
        hover && "transition-all duration-200 cursor-pointer",
        hover && glowClasses[glow],
        hover && "hover:-translate-y-0.5",
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: React.ReactNode;
  iconColor?: string;
  subtitle?: string;
  className?: string;
}

export function StatCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon,
  iconColor = "bg-sky-500/15 text-sky-400",
  subtitle,
  className,
}: StatCardProps) {
  const changeColors = {
    positive: "text-emerald-400",
    negative: "text-red-400",
    neutral: "text-slate-400",
  };

  return (
    <Card hover glow="blue" className={className}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-white mt-0.5 truncate">{value}</p>
          {(change || subtitle) && (
            <p className={cn("text-xs mt-1", change ? changeColors[changeType] : "text-slate-500")}>
              {change || subtitle}
            </p>
          )}
        </div>
        {icon && (
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ml-3", iconColor)}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
