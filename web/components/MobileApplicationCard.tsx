"use client";

import Link from "next/link";
import { ApplicationStage } from "@prisma/client";
import SwipeableCard from "@/components/ui/SwipeableCard";
import { formatDateTime } from "@/lib/dateUtils";

type AppItem = {
  id: string;
  company: string;
  title: string;
  stage: ApplicationStage;
  location: string | null;
  appliedDate: string | null;
  updatedAt: string;
};

const stageConfig: Record<ApplicationStage, { label: string; color: string; bg: string }> = {
  SAVED: { label: "Saved", color: "text-zinc-600 dark:text-zinc-400", bg: "bg-zinc-100 dark:bg-zinc-700" },
  APPLIED: { label: "Applied", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/30" },
  INTERVIEW: { label: "Interview", color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-100 dark:bg-purple-900/30" },
  OFFER: { label: "Offer", color: "text-green-600 dark:text-green-400", bg: "bg-green-100 dark:bg-green-900/30" },
  REJECTED: { label: "Rejected", color: "text-red-600 dark:text-red-400", bg: "bg-red-100 dark:bg-red-900/30" },
};

interface MobileApplicationCardProps {
  item: AppItem;
  onDelete?: () => void;
  onQuickStage?: () => void;
}

export default function MobileApplicationCard({
  item,
  onDelete,
  onQuickStage,
}: MobileApplicationCardProps) {
  const stage = stageConfig[item.stage];

  return (
    <SwipeableCard
      className="mb-2"
      leftAction={
        onQuickStage
          ? {
              label: "Edit",
              color: "blue",
              icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              ),
              onAction: onQuickStage,
            }
          : undefined
      }
      rightAction={
        onDelete
          ? {
              label: "Delete",
              color: "red",
              icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              ),
              onAction: onDelete,
            }
          : undefined
      }
    >
      <Link
        href={`/applications/${item.id}`}
        className="block p-4 active:bg-zinc-50 dark:active:bg-zinc-700/50"
      >
        <div className="flex items-start gap-3">
          {/* Company Initial Avatar */}
          <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${stage.bg} flex items-center justify-center`}>
            <span className={`text-sm font-bold ${stage.color}`}>
              {item.company.charAt(0).toUpperCase()}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                {item.company}
              </h3>
              <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full ${stage.bg} ${stage.color}`}>
                {stage.label}
              </span>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 truncate mt-0.5">
              {item.title}
            </p>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-zinc-500 dark:text-zinc-500">
              {item.location && (
                <span className="flex items-center gap-1">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {item.location}
                </span>
              )}
              <span className="text-zinc-300 dark:text-zinc-600">•</span>
              <span>{formatDateTime(item.updatedAt).split(",")[0]}</span>
            </div>
          </div>

          {/* Chevron */}
          <svg className="flex-shrink-0 w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </Link>
    </SwipeableCard>
  );
}
