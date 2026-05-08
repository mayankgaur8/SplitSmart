"use client";

import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: "blue" | "purple" | "green" | "orange" | "red" | "gradient";
  size?: "xs" | "sm" | "md";
  showLabel?: boolean;
  label?: string;
  className?: string;
  animated?: boolean;
}

const colorClasses = {
  blue: "bg-sky-500",
  purple: "bg-violet-500",
  green: "bg-emerald-500",
  orange: "bg-amber-500",
  red: "bg-red-500",
  gradient: "bg-gradient-to-r from-sky-500 to-violet-500",
};

const sizeClasses = {
  xs: "h-1",
  sm: "h-1.5",
  md: "h-2",
};

export function ProgressBar({
  value,
  max = 100,
  color = "gradient",
  size = "sm",
  showLabel,
  label,
  className,
  animated,
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className={cn("w-full", className)}>
      {(showLabel || label) && (
        <div className="flex items-center justify-between mb-1">
          {label && <span className="text-xs text-slate-400">{label}</span>}
          {showLabel && (
            <span className="text-xs text-slate-300 font-medium">{Math.round(percentage)}%</span>
          )}
        </div>
      )}
      <div className={cn("w-full bg-white/8 rounded-full overflow-hidden", sizeClasses[size])}>
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700 ease-out",
            colorClasses[color],
            animated && "animate-pulse"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
