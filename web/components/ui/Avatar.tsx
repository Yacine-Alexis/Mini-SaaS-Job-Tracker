"use client";

import { useMemo } from "react";

interface AvatarProps {
  email?: string | null;
  name?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

// Generate a consistent color based on the string
function stringToColor(str: string): string {
  const colors = [
    "from-red-500 to-pink-500",
    "from-orange-500 to-amber-500",
    "from-amber-500 to-yellow-500",
    "from-green-500 to-emerald-500",
    "from-emerald-500 to-teal-500",
    "from-teal-500 to-cyan-500",
    "from-cyan-500 to-blue-500",
    "from-blue-500 to-indigo-500",
    "from-indigo-500 to-violet-500",
    "from-violet-500 to-purple-500",
    "from-purple-500 to-fuchsia-500",
    "from-fuchsia-500 to-pink-500",
  ];
  
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

// Get initials from email or name
function getInitials(email?: string | null, name?: string | null): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  
  if (email) {
    const localPart = email.split("@")[0];
    // If email has a dot, use first letters of each part
    if (localPart.includes(".")) {
      const parts = localPart.split(".");
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return localPart.slice(0, 2).toUpperCase();
  }
  
  return "??";
}

export default function Avatar({ email, name, size = "md", className = "" }: AvatarProps) {
  const initials = useMemo(() => getInitials(email, name), [email, name]);
  const colorClass = useMemo(() => stringToColor(email || name || "default"), [email, name]);
  
  const sizeClasses = {
    xs: "h-6 w-6 text-[10px]",
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
    xl: "h-16 w-16 text-xl",
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full bg-gradient-to-br ${colorClass} text-white font-semibold shadow-sm ${sizeClasses[size]} ${className}`}
      title={name || email || "User"}
    >
      {initials}
    </div>
  );
}

// Avatar with status indicator
interface AvatarWithStatusProps extends AvatarProps {
  status?: "online" | "offline" | "away" | "busy";
}

export function AvatarWithStatus({ status, size = "md", ...props }: AvatarWithStatusProps) {
  const statusColors = {
    online: "bg-green-500",
    offline: "bg-zinc-400",
    away: "bg-amber-500",
    busy: "bg-red-500",
  };
  
  const statusSizes = {
    xs: "h-1.5 w-1.5 ring-1",
    sm: "h-2 w-2 ring-1",
    md: "h-2.5 w-2.5 ring-2",
    lg: "h-3 w-3 ring-2",
    xl: "h-4 w-4 ring-2",
  };

  return (
    <div className="relative inline-block">
      <Avatar size={size} {...props} />
      {status && (
        <span
          className={`absolute bottom-0 right-0 block rounded-full ring-white dark:ring-zinc-800 ${statusColors[status]} ${statusSizes[size]}`}
        />
      )}
    </div>
  );
}

// Avatar group for showing multiple users
interface AvatarGroupProps {
  users: Array<{ email?: string | null; name?: string | null }>;
  max?: number;
  size?: "xs" | "sm" | "md";
}

export function AvatarGroup({ users, max = 4, size = "sm" }: AvatarGroupProps) {
  const visibleUsers = users.slice(0, max);
  const remainingCount = users.length - max;
  
  const overlapClasses = {
    xs: "-ml-2",
    sm: "-ml-2.5",
    md: "-ml-3",
  };
  
  const sizeClasses = {
    xs: "h-6 w-6 text-[10px]",
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
  };

  return (
    <div className="flex items-center">
      {visibleUsers.map((user, index) => (
        <div
          key={user.email || index}
          className={`relative inline-block ring-2 ring-white dark:ring-zinc-800 rounded-full ${index > 0 ? overlapClasses[size] : ""}`}
          style={{ zIndex: visibleUsers.length - index }}
        >
          <Avatar email={user.email} name={user.name} size={size} />
        </div>
      ))}
      {remainingCount > 0 && (
        <div
          className={`relative inline-flex items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 font-medium ring-2 ring-white dark:ring-zinc-800 ${overlapClasses[size]} ${sizeClasses[size]}`}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}
