"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ApplicationStage } from "@prisma/client";
import { useToast } from "@/components/ui/Toast";

interface Application {
  id: string;
  company: string;
  title: string;
  stage: ApplicationStage;
  location?: string | null;
  updatedAt: string;
}

interface KanbanBoardProps {
  applications: Application[];
  onStageChange: (id: string, newStage: ApplicationStage) => Promise<void>;
  onRefresh?: () => void;
}

const stageConfig: { stage: ApplicationStage; label: string; color: string; bgColor: string; emoji: string }[] = [
  { stage: "SAVED", label: "Saved", color: "border-zinc-300 dark:border-zinc-600", bgColor: "bg-zinc-50 dark:bg-zinc-800/50", emoji: "📌" },
  { stage: "APPLIED", label: "Applied", color: "border-blue-300 dark:border-blue-700", bgColor: "bg-blue-50 dark:bg-blue-900/20", emoji: "📤" },
  { stage: "INTERVIEW", label: "Interview", color: "border-purple-300 dark:border-purple-700", bgColor: "bg-purple-50 dark:bg-purple-900/20", emoji: "🎤" },
  { stage: "OFFER", label: "Offer", color: "border-green-300 dark:border-green-700", bgColor: "bg-green-50 dark:bg-green-900/20", emoji: "🎉" },
  { stage: "REJECTED", label: "Rejected", color: "border-red-300 dark:border-red-700", bgColor: "bg-red-50 dark:bg-red-900/20", emoji: "❌" },
];

export function KanbanBoard({ applications, onStageChange, onRefresh }: KanbanBoardProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<ApplicationStage | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const { addToast } = useToast();

  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
    setDraggedId(id);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
    setDragOverStage(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, stage: ApplicationStage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStage(stage);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverStage(null);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, newStage: ApplicationStage) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    const app = applications.find(a => a.id === id);
    
    if (!app || app.stage === newStage) {
      setDragOverStage(null);
      setDraggedId(null);
      return;
    }

    setUpdating(id);
    setDragOverStage(null);
    setDraggedId(null);

    try {
      await onStageChange(id, newStage);
      addToast({ 
        type: "success", 
        title: `Moved to ${newStage.charAt(0) + newStage.slice(1).toLowerCase()}`,
        message: app.company
      });
      onRefresh?.();
    } catch {
      addToast({ type: "error", title: "Failed to update stage" });
    } finally {
      setUpdating(null);
    }
  }, [applications, onStageChange, onRefresh, addToast]);

  // Group applications by stage
  const grouped = stageConfig.reduce((acc, { stage }) => {
    acc[stage] = applications.filter(app => app.stage === stage);
    return acc;
  }, {} as Record<ApplicationStage, Application[]>);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0">
      {stageConfig.map(({ stage, label, color, bgColor, emoji }) => (
        <div
          key={stage}
          className={`
            flex-shrink-0 w-72 rounded-xl border-2 transition-all duration-200
            ${dragOverStage === stage ? `${color} ring-2 ring-offset-2 ring-blue-500` : "border-transparent"}
            ${bgColor}
          `}
          onDragOver={(e) => handleDragOver(e, stage)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, stage)}
        >
          {/* Column Header */}
          <div className="p-3 border-b border-zinc-200 dark:border-zinc-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{emoji}</span>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{label}</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
                {grouped[stage].length}
              </span>
            </div>
          </div>

          {/* Cards */}
          <div className="p-2 space-y-2 min-h-[200px] max-h-[500px] overflow-y-auto">
            {grouped[stage].length === 0 ? (
              <div className="text-center py-8 text-zinc-400 dark:text-zinc-500">
                <p className="text-sm">No applications</p>
                <p className="text-xs mt-1">Drag here to move</p>
              </div>
            ) : (
              grouped[stage].map((app) => (
                <KanbanCard
                  key={app.id}
                  application={app}
                  isDragging={draggedId === app.id}
                  isUpdating={updating === app.id}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                />
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

interface KanbanCardProps {
  application: Application;
  isDragging: boolean;
  isUpdating: boolean;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
}

function KanbanCard({ application, isDragging, isUpdating, onDragStart, onDragEnd }: KanbanCardProps) {
  return (
    <div
      draggable={!isUpdating}
      onDragStart={(e) => onDragStart(e, application.id)}
      onDragEnd={onDragEnd}
      className={`
        group relative p-3 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700
        cursor-grab active:cursor-grabbing
        hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-600
        transition-all duration-200
        ${isDragging ? "opacity-50 scale-95 shadow-lg" : ""}
        ${isUpdating ? "opacity-50 pointer-events-none" : ""}
      `}
    >
      {isUpdating && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-zinc-800/50 rounded-lg">
          <svg className="animate-spin h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      )}

      <Link href={`/applications/${application.id}`} className="block">
        <h4 className="font-medium text-sm text-zinc-900 dark:text-zinc-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {application.company}
        </h4>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
          {application.title}
        </p>
        {application.location && (
          <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate mt-0.5">
            📍 {application.location}
          </p>
        )}
      </Link>

      {/* Drag handle indicator */}
      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <svg className="h-4 w-4 text-zinc-400" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="9" cy="5" r="1.5" />
          <circle cx="15" cy="5" r="1.5" />
          <circle cx="9" cy="12" r="1.5" />
          <circle cx="15" cy="12" r="1.5" />
          <circle cx="9" cy="19" r="1.5" />
          <circle cx="15" cy="19" r="1.5" />
        </svg>
      </div>
    </div>
  );
}

// Compact horizontal stage selector (alternative to full kanban)
interface StageSelectorProps {
  currentStage: ApplicationStage;
  onChange: (stage: ApplicationStage) => void;
  disabled?: boolean;
}

export function StageSelector({ currentStage, onChange, disabled }: StageSelectorProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
      {stageConfig.map(({ stage, label, emoji }) => (
        <button
          key={stage}
          onClick={() => onChange(stage)}
          disabled={disabled}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
            ${currentStage === stage
              ? "bg-white dark:bg-zinc-700 shadow text-zinc-900 dark:text-zinc-100"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          <span>{emoji}</span>
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}
