"use client";

type Props = {
  min: number | null;
  max: number | null;
  className?: string;
};

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${Math.round(value / 1000)}k`;
  }
  return `$${value.toLocaleString()}`;
}

export default function SalaryDisplay({ min, max, className = "" }: Props) {
  if (min == null && max == null) {
    return (
      <span className={`text-zinc-400 dark:text-zinc-500 ${className}`}>
        Not specified
      </span>
    );
  }

  if (min != null && max != null) {
    if (min === max) {
      return (
        <span className={`font-medium text-green-600 dark:text-green-400 ${className}`}>
          {formatCurrency(min)}
        </span>
      );
    }
    return (
      <span className={`font-medium text-green-600 dark:text-green-400 ${className}`}>
        {formatCurrency(min)} – {formatCurrency(max)}
      </span>
    );
  }

  if (min != null) {
    return (
      <span className={`font-medium text-green-600 dark:text-green-400 ${className}`}>
        From {formatCurrency(min)}
      </span>
    );
  }

  return (
    <span className={`font-medium text-green-600 dark:text-green-400 ${className}`}>
      Up to {formatCurrency(max!)}
    </span>
  );
}

// Utility component for salary range bar
export function SalaryRangeBar({ min, max, marketMin = 50000, marketMax = 200000 }: Props & { marketMin?: number; marketMax?: number }) {
  if (min == null && max == null) return null;

  const rangeStart = min ?? max ?? 0;
  const rangeEnd = max ?? min ?? 0;

  const totalRange = marketMax - marketMin;
  const leftPercent = Math.max(0, Math.min(100, ((rangeStart - marketMin) / totalRange) * 100));
  const widthPercent = Math.max(5, Math.min(100 - leftPercent, ((rangeEnd - rangeStart) / totalRange) * 100));

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
        <span>{formatCurrency(marketMin)}</span>
        <span>{formatCurrency(marketMax)}</span>
      </div>
      <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-green-400 to-green-600 dark:from-green-500 dark:to-green-400 rounded-full"
          style={{ marginLeft: `${leftPercent}%`, width: `${widthPercent}%` }}
        />
      </div>
      <div className="text-center">
        <SalaryDisplay min={min} max={max} className="text-sm" />
      </div>
    </div>
  );
}
