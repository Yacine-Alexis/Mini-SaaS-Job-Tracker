"use client";

import { ApplicationStage } from "@prisma/client";

const STAGE_ORDER: ApplicationStage[] = [
  ApplicationStage.SAVED,
  ApplicationStage.APPLIED,
  ApplicationStage.INTERVIEW,
  ApplicationStage.OFFER,
];

const STAGE_LABELS: Record<ApplicationStage, string> = {
  SAVED: "Saved",
  APPLIED: "Applied",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
};

const STAGE_COLORS: Record<ApplicationStage, { bg: string; text: string; border: string }> = {
  SAVED: { bg: "bg-zinc-100 dark:bg-zinc-700", text: "text-zinc-600 dark:text-zinc-300", border: "border-zinc-300 dark:border-zinc-600" },
  APPLIED: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300", border: "border-blue-300 dark:border-blue-700" },
  INTERVIEW: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-300", border: "border-amber-300 dark:border-amber-700" },
  OFFER: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-300", border: "border-green-300 dark:border-green-700" },
  REJECTED: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-300", border: "border-red-300 dark:border-red-700" },
};

type Props = {
  currentStage: ApplicationStage;
  onStageClick?: (stage: ApplicationStage) => void;
  interactive?: boolean;
};

export default function StageProgressIndicator({ currentStage, onStageClick, interactive = false }: Props) {
  if (currentStage === ApplicationStage.REJECTED) {
    return (
      <div className="flex items-center gap-2">
        <div className={`px-4 py-2 rounded-lg border ${STAGE_COLORS.REJECTED.bg} ${STAGE_COLORS.REJECTED.text} ${STAGE_COLORS.REJECTED.border}`}>
          <span className="text-sm font-medium">Rejected</span>
        </div>
      </div>
    );
  }

  const currentIndex = STAGE_ORDER.indexOf(currentStage);

  return (
    <div className="flex items-center gap-1">
      {STAGE_ORDER.map((stage, index) => {
        const isCompleted = index <= currentIndex;
        const isCurrent = index === currentIndex;
        const colors = STAGE_COLORS[stage];

        return (
          <div key={stage} className="flex items-center">
            {interactive && onStageClick ? (
              <button
                onClick={() => onStageClick(stage)}
                className={`
                  px-3 py-1.5 rounded-lg text-xs font-medium transition-all border
                  ${isCompleted ? `${colors.bg} ${colors.text} ${colors.border}` : "bg-zinc-50 text-zinc-400 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-500 dark:border-zinc-700"}
                  ${isCurrent ? "ring-2 ring-offset-1 ring-zinc-400 dark:ring-zinc-500 dark:ring-offset-zinc-900" : ""}
                  hover:opacity-80
                `}
              >
                {STAGE_LABELS[stage]}
              </button>
            ) : (
              <div
                className={`
                  px-3 py-1.5 rounded-lg text-xs font-medium border
                  ${isCompleted ? `${colors.bg} ${colors.text} ${colors.border}` : "bg-zinc-50 text-zinc-400 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-500 dark:border-zinc-700"}
                  ${isCurrent ? "ring-2 ring-offset-1 ring-zinc-400 dark:ring-zinc-500 dark:ring-offset-zinc-900" : ""}
                `}
              >
                {STAGE_LABELS[stage]}
              </div>
            )}
            {index < STAGE_ORDER.length - 1 && (
              <div className={`w-4 h-0.5 ${index < currentIndex ? "bg-zinc-400 dark:bg-zinc-500" : "bg-zinc-200 dark:bg-zinc-700"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
