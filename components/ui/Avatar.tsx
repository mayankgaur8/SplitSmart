"use client";

import { cn, getInitials, generateAvatarColor } from "@/lib/utils";

interface AvatarProps {
  name: string;
  imageUrl?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  isOnline?: boolean;
  className?: string;
}

const sizeClasses = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-xl",
};

export function Avatar({ name, imageUrl, size = "md", isOnline, className }: AvatarProps) {
  const gradient = generateAvatarColor(name);

  return (
    <div className={cn("relative flex-shrink-0", className)}>
      <div
        className={cn(
          "rounded-full flex items-center justify-center font-semibold",
          sizeClasses[size],
          !imageUrl && `bg-gradient-to-br ${gradient}`
        )}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover rounded-full"
          />
        ) : (
          <span className="text-white select-none">{getInitials(name)}</span>
        )}
      </div>
      {isOnline !== undefined && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full border-2 border-[#060914]",
            size === "xs" || size === "sm" ? "w-2 h-2" : "w-2.5 h-2.5",
            isOnline ? "bg-emerald-400" : "bg-slate-500"
          )}
        />
      )}
    </div>
  );
}

interface AvatarGroupProps {
  users: Array<{ name: string; imageUrl?: string }>;
  max?: number;
  size?: "xs" | "sm" | "md";
}

export function AvatarGroup({ users, max = 4, size = "sm" }: AvatarGroupProps) {
  const visible = users.slice(0, max);
  const remaining = users.length - max;

  return (
    <div className="flex items-center">
      {visible.map((user, i) => (
        <div
          key={i}
          className={cn(
            "-ml-2 first:ml-0 ring-2 ring-[#0d1128] rounded-full",
          )}
        >
          <Avatar name={user.name} imageUrl={user.imageUrl} size={size} />
        </div>
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            "-ml-2 rounded-full bg-slate-700 border-2 border-[#0d1128] flex items-center justify-center text-white font-semibold",
            sizeClasses[size]
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
