"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { type ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success" | "outline";
  size?: "xs" | "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantClasses = {
  primary:
    "bg-gradient-to-r from-sky-500 to-violet-500 text-white hover:opacity-90 hover:-translate-y-0.5 shadow-lg shadow-sky-500/20",
  secondary:
    "bg-white/8 text-white border border-white/12 hover:bg-white/12 hover:-translate-y-0.5",
  ghost: "text-white/70 hover:text-white hover:bg-white/8",
  danger:
    "bg-red-500/15 text-red-400 border border-red-500/20 hover:bg-red-500/25",
  success:
    "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/25",
  outline:
    "bg-transparent text-white border border-white/20 hover:bg-white/8",
};

const sizeClasses = {
  xs: "px-2.5 py-1 text-xs rounded-lg gap-1",
  sm: "px-3.5 py-1.5 text-sm rounded-xl gap-1.5",
  md: "px-5 py-2.5 text-sm rounded-xl gap-2",
  lg: "px-7 py-3.5 text-base rounded-2xl gap-2.5",
};

export function Button({
  variant = "primary",
  size = "md",
  isLoading,
  leftIcon,
  rightIcon,
  fullWidth,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-semibold transition-all duration-150 active:scale-95 cursor-pointer select-none",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        (disabled || isLoading) && "opacity-50 pointer-events-none",
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        leftIcon && <span className="flex-shrink-0">{leftIcon}</span>
      )}
      {children}
      {!isLoading && rightIcon && (
        <span className="flex-shrink-0">{rightIcon}</span>
      )}
    </button>
  );
}
