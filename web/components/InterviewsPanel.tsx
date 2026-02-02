"use client";

import { useEffect, useState, useCallback } from "react";
import { InterviewType, InterviewResult } from "@prisma/client";
import { ConfirmModal } from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";

type Interview = {
  id: string;
  scheduledAt: string;
  duration: number | null;
  type: InterviewType;
  location: string | null;
  interviewers: string[];
  notes: string | null;
  feedback: string | null;
  result: InterviewResult;
  createdAt: string;
  application?: {
    id: string;
    company: string;
    title: string;
  };
};

const TYPE_LABELS: Record<InterviewType, string> = {
  PHONE: "📞 Phone",
  VIDEO: "📹 Video",
  ONSITE: "🏢 On-site",
  TECHNICAL: "💻 Technical",
  BEHAVIORAL: "🗣️ Behavioral",
  FINAL: "🎯 Final",
  OTHER: "📋 Other"
};

const RESULT_LABELS: Record<InterviewResult, { label: string; class: string }> = {
  PENDING: { label: "Pending", class: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  PASSED: { label: "Passed", class: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  FAILED: { label: "Failed", class: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  CANCELLED: { label: "Cancelled", class: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400" }
};

function InterviewsSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2].map((i) => (
        <div key={i} className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded" />
            <div className="flex-1">
              <Skeleton className="h-4 w-1/2 mb-1" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function InterviewsPanel({ applicationId }: { applicationId: string }) {
  const [items, setItems] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [duration, setDuration] = useState("60");
  const [type, setType] = useState<InterviewType>("VIDEO");
  const [location, setLocation] = useState("");
  const [interviewers, setInterviewers] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/interviews?applicationId=${encodeURIComponent(applicationId)}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setErr(data?.error?.message ?? "Failed to load interviews");
        return;
      }
      setItems(data.items ?? []);
    } catch {
      setErr("Failed to load interviews");
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    void load();
  }, [load]);

  function resetForm() {
    setScheduledAt("");
    setDuration("60");
    setType("VIDEO");
    setLocation("");
    setInterviewers("");
    setNotes("");
    setShowForm(false);
  }

  async function addInterview() {
    if (!scheduledAt) return;
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch("/api/interviews", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          applicationId,
          scheduledAt: new Date(scheduledAt).toISOString(),
          duration: parseInt(duration, 10) || 60,
          type,
          location: location.trim() || null,
          interviewers: interviewers.split(",").map(s => s.trim()).filter(Boolean),
          notes: notes.trim() || null
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data?.error?.message ?? "Failed to add interview");
        return;
      }
      resetForm();
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/interviews?id=${encodeURIComponent(deleteId)}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) setErr(data?.error?.message ?? "Delete failed");
      else await load();
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }

  // Sort by date, upcoming first
  const sorted = [...items].sort((a, b) => 
    new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
  );

  const now = new Date();
  const upcoming = sorted.filter(i => new Date(i.scheduledAt) >= now && i.result === "PENDING");
  const past = sorted.filter(i => new Date(i.scheduledAt) < now || i.result !== "PENDING");

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Interviews</h2>
        <div className="flex gap-2">
          <button 
            className="btn text-xs" 
            onClick={() => setShowForm(v => !v)}
          >
            {showForm ? "Cancel" : "+ Schedule"}
          </button>
          <button className="btn text-xs" onClick={load} disabled={loading}>Refresh</button>
        </div>
      </div>

      {showForm && (
        <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-medium">Schedule Interview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Date & Time *</label>
              <input
                className="input"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Duration (minutes)</label>
              <input
                className="input"
                type="number"
                min="15"
                max="480"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Interview Type</label>
              <select
                className="input"
                value={type}
                onChange={(e) => setType(e.target.value as InterviewType)}
              >
                {Object.entries(TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Location / Link</label>
              <input
                className="input"
                type="text"
                placeholder="Zoom link, office address..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-zinc-500 mb-1">Interviewers (comma-separated)</label>
              <input
                className="input"
                type="text"
                placeholder="John Smith, Jane Doe"
                value={interviewers}
                onChange={(e) => setInterviewers(e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-zinc-500 mb-1">Notes</label>
              <textarea
                className="input min-h-[60px]"
                placeholder="Preparation notes, topics to cover..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              className="btn btn-primary" 
              onClick={addInterview} 
              disabled={saving || !scheduledAt}
            >
              {saving ? "Scheduling..." : "Schedule Interview"}
            </button>
            <button className="btn" onClick={resetForm} disabled={saving}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {err && <div role="alert" aria-live="polite" className="text-sm text-red-600">{err}</div>}

      {loading ? (
        <InterviewsSkeleton />
      ) : items.length === 0 ? (
        <EmptyState
          icon="calendar"
          title="No interviews scheduled"
          description="Schedule your interviews to keep track of upcoming meetings."
        />
      ) : (
        <div className="space-y-4">
          {upcoming.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">
                Upcoming ({upcoming.length})
              </h3>
              <div className="space-y-2">
                {upcoming.map((interview) => (
                  <InterviewRow 
                    key={interview.id} 
                    interview={interview} 
                    onDelete={(id) => setDeleteId(id)} 
                    onChanged={load} 
                  />
                ))}
              </div>
            </div>
          )}
          
          {past.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">
                Past ({past.length})
              </h3>
              <div className="space-y-2">
                {past.map((interview) => (
                  <InterviewRow 
                    key={interview.id} 
                    interview={interview} 
                    onDelete={(id) => setDeleteId(id)} 
                    onChanged={load} 
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete interview"
        message="Are you sure you want to delete this interview? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}

function InterviewRow({
  interview,
  onDelete,
  onChanged
}: {
  interview: Interview;
  onDelete: (id: string) => void;
  onChanged: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [result, setResult] = useState<InterviewResult>(interview.result);
  const [feedback, setFeedback] = useState(interview.feedback ?? "");
  const [notes, setNotes] = useState(interview.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setResult(interview.result);
    setFeedback(interview.feedback ?? "");
    setNotes(interview.notes ?? "");
  }, [interview.result, interview.feedback, interview.notes]);

  async function save() {
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch(`/api/interviews?id=${encodeURIComponent(interview.id)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          result,
          feedback: feedback.trim() || null,
          notes: notes.trim() || null
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

  const date = new Date(interview.scheduledAt);
  const isPast = date < new Date();
  const resultInfo = RESULT_LABELS[interview.result];

  return (
    <div className={`rounded-lg border p-3 ${
      isPast && interview.result === "PENDING" 
        ? "border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-900/10" 
        : "border-zinc-200 dark:border-zinc-700"
    }`}>
      {!editing ? (
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <div className="text-2xl">{TYPE_LABELS[interview.type].split(" ")[0]}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">{TYPE_LABELS[interview.type].split(" ").slice(1).join(" ")}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${resultInfo.class}`}>
                  {resultInfo.label}
                </span>
              </div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400">
                {date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                {interview.duration && ` · ${interview.duration} min`}
              </div>
              {interview.location && (
                <div className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
                  📍 {interview.location}
                </div>
              )}
              {interview.interviewers.length > 0 && (
                <div className="text-sm text-zinc-500 dark:text-zinc-400">
                  👥 {interview.interviewers.join(", ")}
                </div>
              )}
              {interview.notes && (
                <div className="mt-1 text-sm bg-zinc-50 dark:bg-zinc-800 rounded p-2">
                  {interview.notes}
                </div>
              )}
              {interview.feedback && (
                <div className="mt-1 text-sm bg-blue-50 dark:bg-blue-900/20 rounded p-2 text-blue-800 dark:text-blue-300">
                  <strong>Feedback:</strong> {interview.feedback}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <button className="btn text-xs py-1 px-2" onClick={() => setEditing(true)}>
                {isPast ? "Add Result" : "Edit"}
              </button>
              <button 
                className="btn text-xs py-1 px-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" 
                onClick={() => onDelete(interview.id)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Result</label>
              <select
                className="input"
                value={result}
                onChange={(e) => setResult(e.target.value as InterviewResult)}
              >
                {Object.entries(RESULT_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Notes</label>
            <textarea
              className="input min-h-[60px]"
              placeholder="Interview notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Feedback</label>
            <textarea
              className="input min-h-[60px]"
              placeholder="Feedback from the interview..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
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
                setResult(interview.result);
                setFeedback(interview.feedback ?? "");
                setNotes(interview.notes ?? "");
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
