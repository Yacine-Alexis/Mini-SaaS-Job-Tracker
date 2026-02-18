"use client";

import { ApplicationStage } from "@prisma/client";

interface StageFunnelProps {
  stageCounts: Record<string, number>;
  total: number;
}

const stageConfig: { stage: ApplicationStage; label: string; color: string; bgColor: string }[] = [
  { stage: "SAVED", label: "Saved", color: "bg-zinc-500", bgColor: "bg-zinc-100 dark:bg-zinc-700" },
  { stage: "APPLIED", label: "Applied", color: "bg-blue-500", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
  { stage: "INTERVIEW", label: "Interview", color: "bg-purple-500", bgColor: "bg-purple-100 dark:bg-purple-900/30" },
  { stage: "OFFER", label: "Offer", color: "bg-green-500", bgColor: "bg-green-100 dark:bg-green-900/30" },
  { stage: "REJECTED", label: "Rejected", color: "bg-red-400", bgColor: "bg-red-100 dark:bg-red-900/30" },
];

export function StageFunnel({ stageCounts, total }: StageFunnelProps) {
  // Calculate conversion rates between stages
  const applied = (stageCounts["APPLIED"] ?? 0) + (stageCounts["INTERVIEW"] ?? 0) + (stageCounts["OFFER"] ?? 0) + (stageCounts["REJECTED"] ?? 0);
  const interviewed = (stageCounts["INTERVIEW"] ?? 0) + (stageCounts["OFFER"] ?? 0);
  const offered = stageCounts["OFFER"] ?? 0;
  
  const applicationRate = total > 0 ? Math.round((applied / total) * 100) : 0;
  const interviewRate = applied > 0 ? Math.round((interviewed / applied) * 100) : 0;
  const offerRate = interviewed > 0 ? Math.round((offered / interviewed) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Visual Funnel */}
      <div className="relative">
        {stageConfig.map((config, index) => {
          const count = stageCounts[config.stage] ?? 0;
          const percentage = total > 0 ? (count / total) * 100 : 0;
          // Funnel width decreases as we go down (except rejected which is separate)
          const baseWidth = config.stage === "REJECTED" ? 60 : 100 - (index * 10);
          
          return (
            <div key={config.stage} className="relative mb-1">
              <div 
                className={`
                  relative h-12 rounded-lg ${config.bgColor}
                  flex items-center justify-between px-4
                  transition-all duration-300
                  mx-auto
                `}
                style={{ width: `${baseWidth}%` }}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${config.color}`} />
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {config.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    {count}
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    ({percentage.toFixed(0)}%)
                  </span>
                </div>
                {/* Progress bar overlay */}
                <div 
                  className={`absolute left-0 top-0 h-full ${config.color} rounded-lg opacity-20`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              {/* Connector line */}
              {index < stageConfig.length - 1 && config.stage !== "REJECTED" && (
                <div className="flex justify-center">
                  <svg className="h-2 w-6 text-zinc-300 dark:text-zinc-600" fill="currentColor" viewBox="0 0 24 8">
                    <path d="M12 8L4 0h16L12 8z" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Conversion Rates */}
      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-700">
        <ConversionRate 
          label="Applied" 
          rate={applicationRate} 
          description="Saved → Applied"
        />
        <ConversionRate 
          label="Interview Rate" 
          rate={interviewRate} 
          description="Applied → Interview"
        />
        <ConversionRate 
          label="Offer Rate" 
          rate={offerRate} 
          description="Interview → Offer"
        />
      </div>
    </div>
  );
}

function ConversionRate({ label, rate, description }: { label: string; rate: number; description: string }) {
  const getColorClass = (rate: number) => {
    if (rate >= 50) return "text-green-600 dark:text-green-400";
    if (rate >= 25) return "text-amber-600 dark:text-amber-400";
    return "text-zinc-600 dark:text-zinc-400";
  };

  return (
    <div className="text-center">
      <div className={`text-2xl font-bold ${getColorClass(rate)}`}>
        {rate}%
      </div>
      <div className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{label}</div>
      <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">{description}</div>
    </div>
  );
}

// Horizontal pipeline for compact view
export function StagePipeline({ stageCounts, total }: StageFunnelProps) {
  return (
    <div className="space-y-3">
      {stageConfig.map((config) => {
        const count = stageCounts[config.stage] ?? 0;
        const percentage = total > 0 ? (count / total) * 100 : 0;

        return (
          <div key={config.stage} className="group">
            <div className="flex items-center justify-between text-sm mb-1.5">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${config.color}`} />
                <span className="text-zinc-700 dark:text-zinc-300 font-medium">{config.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-zinc-900 dark:text-zinc-100 font-semibold">{count}</span>
                <span className="text-xs text-zinc-400 dark:text-zinc-500">({percentage.toFixed(0)}%)</span>
              </div>
            </div>
            <div className="h-2.5 rounded-full bg-zinc-100 dark:bg-zinc-700 overflow-hidden">
              <div
                className={`h-full rounded-full ${config.color} transition-all duration-500 ease-out group-hover:opacity-80`}
                style={{ width: `${Math.max(percentage, percentage > 0 ? 2 : 0)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
