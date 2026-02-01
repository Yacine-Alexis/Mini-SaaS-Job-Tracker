"use client";

import { useMemo } from "react";

interface ActivityHeatmapProps {
  /** Array of dates when applications were created (ISO strings) */
  dates: string[];
  /** Number of weeks to show (default 12) */
  weeks?: number;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function ActivityHeatmap({ dates, weeks = 12 }: ActivityHeatmapProps) {
  const { grid, months, maxCount } = useMemo(() => {
    const now = new Date();
    const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - (weeks * 7) + 1);
    
    // Adjust to start on Monday
    const dayOfWeek = startDate.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startDate.setDate(startDate.getDate() - daysToSubtract);

    // Count activities per day
    const countMap = new Map<string, number>();
    for (const dateStr of dates) {
      const date = new Date(dateStr);
      const key = date.toISOString().slice(0, 10);
      countMap.set(key, (countMap.get(key) || 0) + 1);
    }

    // Build grid (weeks x 7 days)
    const grid: { date: Date; count: number; key: string }[][] = [];
    const months: { label: string; weekIndex: number }[] = [];
    let currentMonth = -1;
    let maxCount = 0;

    const current = new Date(startDate);
    let weekIndex = 0;

    while (current <= endDate) {
      const week: { date: Date; count: number; key: string }[] = [];
      
      for (let day = 0; day < 7; day++) {
        if (current > endDate) {
          week.push({ date: new Date(current), count: -1, key: `empty-${weekIndex}-${day}` }); // Future/empty
        } else {
          const key = current.toISOString().slice(0, 10);
          const count = countMap.get(key) || 0;
          maxCount = Math.max(maxCount, count);
          week.push({ date: new Date(current), count, key });
          
          // Track month changes
          if (current.getMonth() !== currentMonth) {
            currentMonth = current.getMonth();
            months.push({
              label: current.toLocaleString("default", { month: "short" }),
              weekIndex
            });
          }
        }
        current.setDate(current.getDate() + 1);
      }
      
      grid.push(week);
      weekIndex++;
    }

    return { grid, months, maxCount };
  }, [dates, weeks]);

  const getIntensityClass = (count: number) => {
    if (count < 0) return "bg-transparent";
    if (count === 0) return "bg-zinc-100 dark:bg-zinc-800";
    if (maxCount === 0) return "bg-zinc-100 dark:bg-zinc-800";
    
    const intensity = count / maxCount;
    if (intensity <= 0.25) return "bg-green-200 dark:bg-green-900/50";
    if (intensity <= 0.5) return "bg-green-400 dark:bg-green-700";
    if (intensity <= 0.75) return "bg-green-500 dark:bg-green-600";
    return "bg-green-600 dark:bg-green-500";
  };

  return (
    <div className="space-y-2">
      {/* Month labels */}
      <div className="flex pl-8 text-xs text-zinc-400 dark:text-zinc-500">
        {months.map((month, i) => (
          <div
            key={i}
            className="flex-shrink-0"
            style={{ 
              marginLeft: i === 0 ? `${month.weekIndex * 14}px` : undefined,
              width: i < months.length - 1 
                ? `${(months[i + 1].weekIndex - month.weekIndex) * 14}px` 
                : "auto"
            }}
          >
            {month.label}
          </div>
        ))}
      </div>

      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-[3px] text-[10px] text-zinc-400 dark:text-zinc-500 pr-1">
          {DAYS.map((day, i) => (
            <div key={day} className="h-[10px] leading-[10px]">
              {i % 2 === 0 ? day : ""}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex gap-[3px] overflow-x-auto">
          {grid.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-[3px]">
              {week.map((day) => (
                <div
                  key={day.key}
                  className={`
                    w-[10px] h-[10px] rounded-sm
                    ${getIntensityClass(day.count)}
                    ${day.count >= 0 ? "cursor-pointer hover:ring-1 hover:ring-zinc-400 dark:hover:ring-zinc-500" : ""}
                    transition-all
                  `}
                  title={day.count >= 0 
                    ? `${day.date.toLocaleDateString()}: ${day.count} application${day.count !== 1 ? "s" : ""}`
                    : undefined
                  }
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 text-xs text-zinc-400 dark:text-zinc-500">
        <span>Less</span>
        <div className="flex gap-[3px]">
          <div className="w-[10px] h-[10px] rounded-sm bg-zinc-100 dark:bg-zinc-800" />
          <div className="w-[10px] h-[10px] rounded-sm bg-green-200 dark:bg-green-900/50" />
          <div className="w-[10px] h-[10px] rounded-sm bg-green-400 dark:bg-green-700" />
          <div className="w-[10px] h-[10px] rounded-sm bg-green-500 dark:bg-green-600" />
          <div className="w-[10px] h-[10px] rounded-sm bg-green-600 dark:bg-green-500" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
}

// Compact version for sidebar
export function MiniActivityHeatmap({ dates, weeks = 8 }: ActivityHeatmapProps) {
  const activityByDay = useMemo(() => {
    const counts: number[] = new Array(weeks * 7).fill(0);
    const now = new Date();
    const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    for (const dateStr of dates) {
      const date = new Date(dateStr);
      const diffDays = Math.floor((endDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays < weeks * 7) {
        counts[weeks * 7 - 1 - diffDays]++;
      }
    }
    
    return counts;
  }, [dates, weeks]);

  const maxCount = Math.max(...activityByDay, 1);
  const totalActivities = activityByDay.reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Activity
        </span>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {totalActivities} in {weeks} weeks
        </span>
      </div>
      <div className="flex gap-px h-8">
        {activityByDay.map((count, i) => {
          const height = count > 0 ? Math.max((count / maxCount) * 100, 10) : 0;
          return (
            <div
              key={i}
              className="flex-1 flex items-end"
              title={`${count} application${count !== 1 ? "s" : ""}`}
            >
              <div
                className={`
                  w-full rounded-t-sm transition-all
                  ${count > 0 ? "bg-green-500 dark:bg-green-400" : "bg-zinc-100 dark:bg-zinc-800"}
                `}
                style={{ height: `${height}%`, minHeight: count > 0 ? "2px" : "1px" }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
