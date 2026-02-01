"use client";

import { ReactNode } from "react";

interface StatsCardProps {
  label: string;
  value: string | number;
  previousValue?: number;
  icon: ReactNode;
  color: "blue" | "green" | "purple" | "orange" | "red" | "indigo";
  subtitle?: string;
  href?: string;
}

const colorClasses = {
  blue: {
    bg: "from-blue-500/10 to-blue-600/10 dark:from-blue-500/20 dark:to-blue-600/20",
    text: "text-blue-600 dark:text-blue-400",
    ring: "ring-blue-500/20",
  },
  green: {
    bg: "from-green-500/10 to-green-600/10 dark:from-green-500/20 dark:to-green-600/20",
    text: "text-green-600 dark:text-green-400",
    ring: "ring-green-500/20",
  },
  purple: {
    bg: "from-purple-500/10 to-purple-600/10 dark:from-purple-500/20 dark:to-purple-600/20",
    text: "text-purple-600 dark:text-purple-400",
    ring: "ring-purple-500/20",
  },
  orange: {
    bg: "from-orange-500/10 to-orange-600/10 dark:from-orange-500/20 dark:to-orange-600/20",
    text: "text-orange-600 dark:text-orange-400",
    ring: "ring-orange-500/20",
  },
  red: {
    bg: "from-red-500/10 to-red-600/10 dark:from-red-500/20 dark:to-red-600/20",
    text: "text-red-600 dark:text-red-400",
    ring: "ring-red-500/20",
  },
  indigo: {
    bg: "from-indigo-500/10 to-indigo-600/10 dark:from-indigo-500/20 dark:to-indigo-600/20",
    text: "text-indigo-600 dark:text-indigo-400",
    ring: "ring-indigo-500/20",
  },
};

export function StatsCard({
  label,
  value,
  previousValue,
  icon,
  color,
  subtitle,
  href,
}: StatsCardProps) {
  const styles = colorClasses[color];
  
  // Calculate trend
  const currentNum = typeof value === "number" ? value : parseFloat(value.replace(/[^0-9.-]/g, "")) || 0;
  const hasTrend = previousValue !== undefined && previousValue !== null;
  const trendValue = hasTrend ? currentNum - previousValue : 0;
  const trendPercent = hasTrend && previousValue !== 0 
    ? Math.round((trendValue / previousValue) * 100) 
    : 0;
  const isPositive = trendValue >= 0;

  const CardContent = (
    <>
      <div className="flex items-start justify-between">
        <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${styles.bg} ${styles.text}`}>
          {icon}
        </div>
        {hasTrend && trendValue !== 0 && (
          <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
            {isPositive ? (
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            ) : (
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            )}
            <span>{Math.abs(trendPercent)}%</span>
          </div>
        )}
      </div>
      <div className="mt-4">
        <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          {value}
        </div>
        <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{label}</div>
        {subtitle && (
          <div className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{subtitle}</div>
        )}
      </div>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className={`card p-5 hover:shadow-lg hover:ring-2 ${styles.ring} transition-all duration-200 cursor-pointer group`}
      >
        {CardContent}
      </a>
    );
  }

  return (
    <div className="card p-5 hover:shadow-md transition-shadow">
      {CardContent}
    </div>
  );
}

// Mini stat for inline use
interface MiniStatProps {
  label: string;
  value: string | number;
  color?: "default" | "success" | "warning" | "danger";
}

export function MiniStat({ label, value, color = "default" }: MiniStatProps) {
  const colorStyles = {
    default: "text-zinc-900 dark:text-zinc-100",
    success: "text-green-600 dark:text-green-400",
    warning: "text-amber-600 dark:text-amber-400",
    danger: "text-red-600 dark:text-red-400",
  };

  return (
    <div className="text-center">
      <div className={`text-2xl font-bold ${colorStyles[color]}`}>{value}</div>
      <div className="text-xs text-zinc-500 dark:text-zinc-400">{label}</div>
    </div>
  );
}
