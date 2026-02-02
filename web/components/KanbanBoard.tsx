"use client";

import { useState, useCallback, useRef, forwardRef } from "react";
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

const stages = stageConfig.map(s => s.stage);

export function KanbanBoard({ applications, onStageChange, onRefresh }: KanbanBoardProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<ApplicationStage | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  // Keyboard navigation state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
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

  // Keyboard navigation: move card to adjacent stage
  const moveToStage = useCallback(async (id: string, newStage: ApplicationStage) => {
    const app = applications.find(a => a.id === id);
    if (!app || app.stage === newStage) return;

    setUpdating(id);
    setIsMoving(false);
    setSelectedId(null);

    try {
      await onStageChange(id, newStage);
      addToast({
        type: "success",
        title: `Moved to ${newStage.charAt(0) + newStage.slice(1).toLowerCase()}`,
        message: app.company
      });
      onRefresh?.();
      
      // Re-focus the moved card after refresh
      setTimeout(() => {
        cardRefs.current.get(id)?.focus();
      }, 100);
    } catch {
      addToast({ type: "error", title: "Failed to update stage" });
    } finally {
      setUpdating(null);
    }
  }, [applications, onStageChange, onRefresh, addToast]);

  // Handle keyboard events on cards
  const handleCardKeyDown = useCallback((e: React.KeyboardEvent, app: Application) => {
    const currentStageIndex = stages.indexOf(app.stage);
    const cardsInStage = applications.filter(a => a.stage === app.stage);
    const cardIndex = cardsInStage.findIndex(a => a.id === app.id);

    switch (e.key) {
      case " ": // Space to toggle move mode
      case "Enter":
        if (e.key === " ") e.preventDefault(); // Prevent scroll
        if (isMoving && selectedId === app.id) {
          // Cancel move mode
          setIsMoving(false);
          setSelectedId(null);
        } else {
          // Enter move mode
          setIsMoving(true);
          setSelectedId(app.id);
        }
        break;

      case "Escape":
        setIsMoving(false);
        setSelectedId(null);
        break;

      case "ArrowLeft":
        e.preventDefault();
        if (isMoving && selectedId === app.id && currentStageIndex > 0) {
          // Move card to previous stage
          moveToStage(app.id, stages[currentStageIndex - 1]);
        } else if (!isMoving) {
          // Navigate to previous column's first card
          const prevStageIndex = currentStageIndex > 0 ? currentStageIndex - 1 : stages.length - 1;
          const prevStageCards = applications.filter(a => a.stage === stages[prevStageIndex]);
          if (prevStageCards.length > 0) {
            cardRefs.current.get(prevStageCards[0].id)?.focus();
          }
        }
        break;

      case "ArrowRight":
        e.preventDefault();
        if (isMoving && selectedId === app.id && currentStageIndex < stages.length - 1) {
          // Move card to next stage
          moveToStage(app.id, stages[currentStageIndex + 1]);
        } else if (!isMoving) {
          // Navigate to next column's first card
          const nextStageIndex = currentStageIndex < stages.length - 1 ? currentStageIndex + 1 : 0;
          const nextStageCards = applications.filter(a => a.stage === stages[nextStageIndex]);
          if (nextStageCards.length > 0) {
            cardRefs.current.get(nextStageCards[0].id)?.focus();
          }
        }
        break;

      case "ArrowUp":
        e.preventDefault();
        if (cardIndex > 0) {
          cardRefs.current.get(cardsInStage[cardIndex - 1].id)?.focus();
        }
        break;

      case "ArrowDown":
        e.preventDefault();
        if (cardIndex < cardsInStage.length - 1) {
          cardRefs.current.get(cardsInStage[cardIndex + 1].id)?.focus();
        }
        break;
    }
  }, [applications, isMoving, selectedId, moveToStage]);

  // Group applications by stage
  const grouped = stageConfig.reduce((acc, { stage }) => {
    acc[stage] = applications.filter(app => app.stage === stage);
    return acc;
  }, {} as Record<ApplicationStage, Application[]>);

  return (
    <div 
      className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0"
      role="application"
      aria-label="Kanban board - Use arrow keys to navigate, Space or Enter to pick up and move cards"
    >
      {/* Screen reader instructions */}
      <div className="sr-only" aria-live="polite">
        {isMoving && selectedId && (
          <>
            Card selected for moving. Use Left/Right arrows to move between columns, Escape to cancel.
          </>
        )}
      </div>

      {stageConfig.map(({ stage, label, color, bgColor, emoji }) => (
        <div
          key={stage}
          role="listbox"
          aria-label={`${label} column, ${grouped[stage].length} applications`}
          className={`
            flex-shrink-0 w-72 rounded-xl border-2 transition-all duration-200
            ${dragOverStage === stage ? `${color} ring-2 ring-offset-2 ring-blue-500` : "border-transparent"}
            ${isMoving && selectedId ? `${color} ring-1 ring-blue-300` : ""}
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
                <span className="text-lg" aria-hidden="true">{emoji}</span>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{label}</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
                {grouped[stage].length}
              </span>
            </div>
          </div>

          {/* Cards */}
          <div className="p-2 space-y-2 min-h-[200px] max-h-[500px] overflow-y-auto" role="group">
            {grouped[stage].length === 0 ? (
              <div className="text-center py-8 text-zinc-400 dark:text-zinc-500">
                <p className="text-sm">No applications</p>
                <p className="text-xs mt-1">Drag here to move</p>
              </div>
            ) : (
              grouped[stage].map((app) => (
                <KanbanCard
                  key={app.id}
                  ref={(el) => {
                    if (el) cardRefs.current.set(app.id, el);
                    else cardRefs.current.delete(app.id);
                  }}
                  application={app}
                  isDragging={draggedId === app.id}
                  isUpdating={updating === app.id}
                  isSelected={selectedId === app.id && isMoving}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onKeyDown={(e) => handleCardKeyDown(e, app)}
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
  isSelected: boolean;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

const KanbanCard = forwardRef<HTMLDivElement, KanbanCardProps>(
  function KanbanCard({ application, isDragging, isUpdating, isSelected, onDragStart, onDragEnd, onKeyDown }, ref) {
    const stageLabel = stageConfig.find(s => s.stage === application.stage)?.label || application.stage;
    
    return (
      <div
        ref={ref}
        role="option"
        tabIndex={0}
        aria-selected={isSelected}
        aria-label={`${application.company}, ${application.title}${application.location ? `, ${application.location}` : ""}, in ${stageLabel}. ${isSelected ? "Selected for moving. Use arrow keys to move, Escape to cancel." : "Press Space or Enter to select and move."}`}
        draggable={!isUpdating}
        onDragStart={(e) => onDragStart(e, application.id)}
        onDragEnd={onDragEnd}
        onKeyDown={onKeyDown}
        className={`
          group relative p-3 rounded-lg bg-white dark:bg-zinc-800 border-2
          cursor-grab active:cursor-grabbing
          hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-600
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
          transition-all duration-200
          ${isDragging ? "opacity-50 scale-95 shadow-lg border-zinc-200 dark:border-zinc-700" : "border-zinc-200 dark:border-zinc-700"}
          ${isSelected ? "ring-2 ring-blue-500 ring-offset-1 border-blue-400" : ""}
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

        {/* Selected indicator */}
        {isSelected && (
          <div className="absolute -top-2 -right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </div>
        )}

        <Link href={`/applications/${application.id}`} className="block" tabIndex={-1}>
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
      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true">
        <svg className="h-4 w-4 text-zinc-400" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="9" cy="5" r="1.5" />
          <circle cx="15" cy="5" r="1.5" />
          <circle cx="9" cy="12" r="1.5" />
          <circle cx="15" cy="12" r="1.5" />
          <circle cx="9" cy="19" r="1.5" />
          <circle cx="15" cy="19" r="1.5" />
        </svg>
      </div>

      {/* Keyboard hint */}
      <div className="absolute bottom-1 right-1 opacity-0 group-focus:opacity-100 text-[10px] text-zinc-400 transition-opacity">
        ←→ move
      </div>
    </div>
  );
});

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
