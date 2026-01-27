"use client";

import { useEffect, useState } from "react";
import { TaskStatus } from "@prisma/client";

type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  dueDate: string | null;
  createdAt: string;
};

export default function TasksPanel({ applicationId }: { applicationId: string }) {
  const [items, setItems] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState(""); // yyyy-mm-dd
  const [saving, setSaving] = useState(false);

  const [showDone, setShowDone] = useState(true);

  async function load() {
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
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId]);

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

  async function deleteTask(id: string) {
    if (!confirm("Delete this task?")) return;
    const res = await fetch(`/api/tasks?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) setErr(data?.error?.message ?? "Delete failed");
    else await load();
  }

  const visible = showDone ? items : items.filter((t) => t.status !== TaskStatus.DONE);

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Tasks</h2>
        <div className="flex gap-2">
          <button className="btn" onClick={() => setShowDone((v) => !v)}>
            {showDone ? "Hide done" : "Show done"}
          </button>
          <button className="btn" onClick={load} disabled={loading}>Refresh</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <input
          className="input md:col-span-2"
          placeholder="Add a task…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          className="input"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
        <button className="btn btn-primary md:col-span-3" onClick={addTask} disabled={saving || !title.trim()}>
          {saving ? "Adding…" : "Add task"}
        </button>
      </div>

      {loading && <div className="text-sm text-zinc-600">Loading…</div>}
      {err && <div className="text-sm text-red-600">{err}</div>}

      {!loading && !err && visible.length === 0 && (
        <div className="text-sm text-zinc-600">No tasks to show.</div>
      )}

      <div className="space-y-2">
        {visible.map((t) => (
          <TaskRow key={t.id} task={t} onDelete={deleteTask} onChanged={load} />
        ))}
      </div>
    </div>
  );
}

function TaskRow({
  task,
  onDelete,
  onChanged
}: {
  task: Task;
  onDelete: (id: string) => Promise<void>;
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

  return (
    <div className="rounded-lg border border-zinc-200 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge">{task.status}</span>
            {task.dueDate && (
              <span className="text-xs text-zinc-500">
                Due: {new Date(task.dueDate).toISOString().slice(0, 10)}
              </span>
            )}
          </div>

          {!editing ? (
            <div className="mt-1 text-sm">{task.title}</div>
          ) : (
            <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
              <input className="input md:col-span-2" value={title} onChange={(e) => setTitle(e.target.value)} />
              <input className="input" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              <select className="input md:col-span-3" value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)}>
                <option value={TaskStatus.OPEN}>OPEN</option>
                <option value={TaskStatus.DONE}>DONE</option>
              </select>
            </div>
          )}

          {err && <div className="mt-2 text-sm text-red-600">{err}</div>}
        </div>

        {!editing ? (
          <div className="flex gap-2">
            <button className="btn" onClick={toggleDone} disabled={saving}>
              {task.status === TaskStatus.DONE ? "Reopen" : "Done"}
            </button>
            <button className="btn" onClick={() => setEditing(true)} disabled={saving}>Edit</button>
            <button className="btn" onClick={() => onDelete(task.id)} disabled={saving}>Delete</button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button className="btn btn-primary" onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save"}
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
        )}
      </div>
    </div>
  );
}
