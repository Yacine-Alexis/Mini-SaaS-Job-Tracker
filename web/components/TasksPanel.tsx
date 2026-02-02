"use client";

import { useEffect, useState, useCallback } from "react";
import { TaskStatus } from "@prisma/client";
import { ConfirmModal } from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";

type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  dueDate: string | null;
  createdAt: string;
};

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

export default function TasksPanel({ applicationId }: { applicationId: string }) {
  const [items, setItems] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);

  const [showDone, setShowDone] = useState(true);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/tasks?applicationId=${encodeURIComponent(applicationId)}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setErr(data?.error?.message ?? "Failed to load tasks");
        return;
      }
      setItems(data.items ?? []);
    } catch {
      setErr("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function addTask() {
    if (!title.trim()) return;
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          applicationId,
          title: title.trim(),
          dueDate: dueDate ? new Date(dueDate).toISOString() : null
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data?.error?.message ?? "Failed to add task");
        return;
      }
      setTitle("");
      setDueDate("");
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/tasks?id=${encodeURIComponent(deleteId)}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) setErr(data?.error?.message ?? "Delete failed");
      else await load();
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }

  const visible = showDone ? items : items.filter((t) => t.status !== TaskStatus.DONE);

  // Check for overdue tasks
  const now = new Date();
  const isOverdue = (task: Task) => {
    if (!task.dueDate || task.status === TaskStatus.DONE) return false;
    return new Date(task.dueDate) < now;
  };

  const isDueToday = (task: Task) => {
    if (!task.dueDate || task.status === TaskStatus.DONE) return false;
    const due = new Date(task.dueDate);
    return due.toDateString() === now.toDateString();
  };

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Tasks</h2>
        <div className="flex gap-2">
          <button className="btn text-xs" onClick={() => setShowDone((v) => !v)}>
            {showDone ? "Hide done" : "Show done"}
          </button>
          <button className="btn text-xs" onClick={load} disabled={loading}>Refresh</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <input
          className="input md:col-span-2"
          placeholder="Add a task..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && title.trim()) {
              e.preventDefault();
              addTask();
            }
          }}
        />
        <input
          className="input"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
        <button className="btn btn-primary md:col-span-3" onClick={addTask} disabled={saving || !title.trim()}>
          {saving ? "Adding..." : "Add task"}
        </button>
      </div>

      {err && <div role="alert" aria-live="polite" className="text-sm text-red-600">{err}</div>}

      {loading ? (
        <TasksSkeleton />
      ) : visible.length === 0 ? (
        <EmptyState
          icon="tasks"
          title={showDone ? "No tasks yet" : "No open tasks"}
          description={showDone ? "Add tasks to track your to-dos for this application." : "All tasks are completed!"}
        />
      ) : (
        <div className="space-y-2">
          {visible.map((t) => (
            <TaskRow 
              key={t.id} 
              task={t} 
              isOverdue={isOverdue(t)}
              isDueToday={isDueToday(t)}
              onDelete={(id) => setDeleteId(id)} 
              onChanged={load} 
            />
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}

function TaskRow({
  task,
  isOverdue,
  isDueToday,
  onDelete,
  onChanged
}: {
  task: Task;
  isOverdue: boolean;
  isDueToday: boolean;
  onDelete: (id: string) => void;
  onChanged: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [dueDate, setDueDate] = useState(task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : "");
  const [status, setStatus] = useState<TaskStatus>(task.status);

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setTitle(task.title);
    setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : "");
    setStatus(task.status);
  }, [task.title, task.dueDate, task.status]);

  async function save() {
    if (!title.trim()) {
      setErr("Task title cannot be empty.");
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch(`/api/tasks?id=${encodeURIComponent(task.id)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          status,
          dueDate: dueDate ? new Date(dueDate).toISOString() : null
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data?.error?.message ?? "Update failed");
        return;
      }
      setEditing(false);
      await onChanged();
    } finally {
      setSaving(false);
    }
  }

  async function toggleDone() {
    const next = task.status === TaskStatus.DONE ? TaskStatus.OPEN : TaskStatus.DONE;
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch(`/api/tasks?id=${encodeURIComponent(task.id)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: next })
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data?.error?.message ?? "Update failed");
        return;
      }
      await onChanged();
    } finally {
      setSaving(false);
    }
  }

  const isDone = task.status === TaskStatus.DONE;

  // Due date styling
  let dueBadgeClass = "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";
  if (isOverdue) {
    dueBadgeClass = "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  } else if (isDueToday) {
    dueBadgeClass = "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
  }

  return (
    <div className={`rounded-lg border p-3 ${isOverdue && !isDone ? "border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-900/10" : "border-zinc-200 dark:border-zinc-700"}`}>
      {!editing ? (
        <div className="flex items-start gap-3">
          <button
            onClick={toggleDone}
            disabled={saving}
            className={`mt-0.5 flex-shrink-0 h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${
              isDone
                ? "bg-green-500 border-green-500 text-white"
                : "border-zinc-300 dark:border-zinc-600 hover:border-green-500"
            }`}
          >
            {isDone && (
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
          <div className="flex-1 min-w-0">
            <div className={`text-sm ${isDone ? "line-through text-zinc-400" : ""}`}>
              {task.title}
            </div>
            {task.dueDate && (
              <div className={`inline-block mt-1 text-xs px-2 py-0.5 rounded ${dueBadgeClass}`}>
                {isOverdue ? "Overdue: " : isDueToday ? "Due today: " : "Due: "}
                {new Date(task.dueDate).toLocaleDateString()}
              </div>
            )}
          </div>
          <div className="flex gap-1">
            <button className="btn text-xs py-1 px-2" onClick={() => setEditing(true)}>Edit</button>
            <button className="btn text-xs py-1 px-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => onDelete(task.id)}>Delete</button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              className="input"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
            <select
              className="input"
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
            >
              <option value={TaskStatus.OPEN}>Open</option>
              <option value={TaskStatus.DONE}>Done</option>
            </select>
          </div>
          {err && <div role="alert" aria-live="polite" className="text-sm text-red-600">{err}</div>}
          <div className="flex gap-2">
            <button className="btn btn-primary" onClick={save} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              className="btn"
              onClick={() => {
                setErr(null);
                setTitle(task.title);
                setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : "");
                setStatus(task.status);
                setEditing(false);
              }}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
