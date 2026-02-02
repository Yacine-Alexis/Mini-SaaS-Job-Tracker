"use client";

import { useState } from "react";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { TaskStatus } from "@prisma/client";
import { ConfirmModal } from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { fetcher, postFetcher, patchFetcher, FetchError } from "@/lib/fetcher";

type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  dueDate: string | null;
  createdAt: string;
};

interface TasksResponse {
  items: Task[];
}

function TasksSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-3 flex items-center gap-3">
          <Skeleton className="h-5 w-5 rounded" />
          <div className="flex-1">
            <Skeleton className="h-4 w-3/4 mb-1" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface TasksPanelSWRProps {
  applicationId: string;
}

/**
 * TasksPanel with SWR caching
 * 
 * Benefits:
 * - Optimistic UI updates for checkbox toggle
 * - Auto-retry on network failures
 * - Cache deduplication across components
 */
export default function TasksPanelSWR({ applicationId }: TasksPanelSWRProps) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [showDone, setShowDone] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Fetch tasks with SWR
  const tasksKey = `/api/tasks?applicationId=${encodeURIComponent(applicationId)}`;
  const { data, error, isLoading, mutate } = useSWR<TasksResponse, FetchError>(
    tasksKey,
    fetcher
  );

  // Create task mutation
  const { trigger: createTask, isMutating: isCreating } = useSWRMutation<
    { task: Task },
    FetchError,
    string,
    { applicationId: string; title: string; dueDate?: string | null }
  >("/api/tasks", postFetcher, {
    onSuccess: () => {
      setTitle("");
      setDueDate("");
      mutate();
    },
  });

  // Toggle task status mutation
  const { trigger: toggleTask } = useSWRMutation<
    { task: Task },
    FetchError,
    string,
    { status: TaskStatus }
  >(
    "/api/tasks", // Base URL, we'll construct the full URL in the fetcher
    async (url, { arg }) => {
      // This will be called with the task-specific URL
      const res = await fetch(url, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(arg),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new FetchError(
          data?.error?.message || "Failed to update",
          res.status,
          data?.error?.code || "UPDATE_ERROR"
        );
      }
      return res.json();
    }
  );

  // Delete task - use direct fetch since key changes
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDeleteTask() {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/tasks?id=${deleteId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error?.message || "Failed to delete");
      }
      setDeleteId(null);
      mutate(); // Revalidate
    } catch {
      // Error shown via UI
    } finally {
      setIsDeleting(false);
    }
  }

  const items = data?.items ?? [];
  const err = error?.message;

  // Filter based on showDone
  const filteredItems = showDone 
    ? items 
    : items.filter(t => t.status !== "DONE");

  // Sort: OPEN first, then by due date
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === "OPEN" ? -1 : 1;
    }
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return 0;
  });

  async function handleAddTask() {
    if (!title.trim()) return;
    try {
      await createTask({
        applicationId,
        title: title.trim(),
        dueDate: dueDate || null,
      });
    } catch {
      // Error handled by SWR
    }
  }

  async function handleToggle(task: Task) {
    const newStatus = task.status === "DONE" ? "OPEN" : "DONE";
    
    // Optimistic update
    mutate(
      (current) => {
        if (!current) return current;
        return {
          ...current,
          items: current.items.map((t) =>
            t.id === task.id ? { ...t, status: newStatus } : t
          ),
        };
      },
      { revalidate: false }
    );

    try {
      // Make the actual API call
      const res = await fetch(`/api/tasks?id=${task.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!res.ok) {
        // Revert on error
        mutate();
        throw new Error("Failed to update");
      }
    } catch {
      // Revalidate to get correct state
      mutate();
    }
  }

  async function handleConfirmDelete() {
    await handleDeleteTask();
  }

  function getDueDateColor(dueDate: string | null): string {
    if (!dueDate) return "text-zinc-500 dark:text-zinc-400";
    const due = new Date(dueDate);
    const now = new Date();
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "text-red-600 dark:text-red-400";
    if (diffDays <= 2) return "text-amber-600 dark:text-amber-400";
    return "text-zinc-500 dark:text-zinc-400";
  }

  if (isLoading) return <TasksSkeleton />;

  if (err) {
    return (
      <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-600 dark:text-red-400">
        {err}
        <button className="ml-2 underline hover:no-underline" onClick={() => mutate()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add task form */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a task..."
          className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAddTask();
          }}
        />
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleAddTask}
          disabled={isCreating || !title.trim()}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
        >
          {isCreating ? "Adding..." : "Add Task"}
        </button>
      </div>

      {/* Filter toggle */}
      {items.some((t) => t.status === "DONE") && (
        <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 cursor-pointer">
          <input
            type="checkbox"
            checked={showDone}
            onChange={(e) => setShowDone(e.target.checked)}
            className="rounded border-zinc-300 dark:border-zinc-600"
          />
          Show completed tasks
        </label>
      )}

      {/* Tasks list */}
      {sortedItems.length === 0 ? (
        <EmptyState
          icon="tasks"
          title="No tasks yet"
          description="Add a task to track your to-dos for this application."
        />
      ) : (
        <div className="space-y-2">
          {sortedItems.map((task) => (
            <div
              key={task.id}
              className={`group flex items-center gap-3 rounded-lg border border-zinc-200 dark:border-zinc-700 p-3 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors ${
                task.status === "DONE" ? "opacity-60" : ""
              }`}
            >
              <button
                onClick={() => handleToggle(task)}
                className={`flex-shrink-0 h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${
                  task.status === "DONE"
                    ? "bg-green-500 border-green-500 text-white"
                    : "border-zinc-300 dark:border-zinc-600 hover:border-blue-500"
                }`}
              >
                {task.status === "DONE" && (
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${task.status === "DONE" ? "line-through text-zinc-500" : "text-zinc-900 dark:text-white"}`}>
                  {task.title}
                </p>
                {task.dueDate && (
                  <p className={`text-xs ${getDueDateColor(task.dueDate)}`}>
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                  </p>
                )}
              </div>

              <button
                onClick={() => setDeleteId(task.id)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                title="Delete task"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation modal */}
      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        variant="danger"
        loading={isDeleting}
      />
    </div>
  );
}
