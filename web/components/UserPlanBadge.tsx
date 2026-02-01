"use client";

import { useEffect, useState } from "react";

interface UserPlanBadgeProps {
  inline?: boolean;
}

export default function UserPlanBadge({ inline = false }: UserPlanBadgeProps) {
  const [plan, setPlan] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/me").then(r => r.json()).then(d => setPlan(d?.user?.plan ?? null)).catch(() => {});
  }, []);

  if (!plan) return null;

  const isPro = plan === "PRO";

  if (inline) {
    return (
      <span className={`text-xs font-medium ${isPro ? "text-amber-600 dark:text-amber-400" : "text-zinc-500 dark:text-zinc-400"}`}>
        {isPro ? "Pro Plan" : "Free Plan"}
      </span>
    );
  }

  return (
    <span className={`hidden sm:inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
      isPro 
        ? "bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800" 
        : "bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400"
    }`}>
      {isPro ? "✨ Pro" : "Free"}
    </span>
  );
}
