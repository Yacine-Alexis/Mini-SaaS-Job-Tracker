"use client";

import { useEffect, useState, useCallback } from "react";
import { ConfirmModal } from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";

type Note = {
  id: string;
  content: string;
  createdAt: string;
};

function NotesSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2].map((i) => (
        <div key={i} className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-3">
          <Skeleton className="h-3 w-24 mb-2" />
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ))}
    </div>
  );
}

export default function NotesPanel({ applicationId }: { applicationId: string }) {
  const [items, setItems] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/notes?applicationId=${encodeURIComponent(applicationId)}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setErr(data?.error?.message ?? "Failed to load notes");
        return;
      }
      setItems(data.items ?? []);
    } catch {
      setErr("Failed to load notes");
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function addNote() {
    if (!draft.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ applicationId, content: draft.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data?.error?.message ?? "Failed to add note");
        return;
      }
      setDraft("");
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/notes?id=${encodeURIComponent(deleteId)}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) setErr(data?.error?.message ?? "Delete failed");
      else await load();
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Notes</h2>
        <button className="btn" onClick={load} disabled={loading}>Refresh</button>
      </div>

      <div className="space-y-2">
        <textarea
          className="input min-h-[90px]"
          placeholder="Add a note..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && draft.trim()) {
              e.preventDefault();
              addNote();
            }
          }}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-500">Ctrl+Enter to save</span>
          <button className="btn btn-primary" onClick={addNote} disabled={saving || !draft.trim()}>
            {saving ? "Adding..." : "Add note"}
          </button>
        </div>
      </div>

      {err && <div role="alert" aria-live="polite" className="text-sm text-red-600">{err}</div>}

      {loading ? (
        <NotesSkeleton />
      ) : items.length === 0 ? (
        <EmptyState
          icon="notes"
          title="No notes yet"
          description="Add notes to track important details about this application."
        />
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <NoteRow key={n.id} note={n} onDelete={(id) => setDeleteId(id)} onChanged={load} />
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete note"
        message="Are you sure you want to delete this note? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}

function NoteRow({
  note,
  onDelete,
  onChanged
}: {
  note: Note;
  onDelete: (id: string) => void;
  onChanged: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(note.content);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setContent(note.content);
  }, [note.content]);

  async function save() {
    if (!content.trim()) {
      setErr("Note cannot be empty.");
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch(`/api/notes?id=${encodeURIComponent(note.id)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: content.trim() })
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

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-3">
      <div className="text-xs text-zinc-500">
        {new Date(note.createdAt).toLocaleString()}
      </div>

      {!editing ? (
        <div className="mt-1 whitespace-pre-wrap text-sm">{note.content}</div>
      ) : (
        <div className="mt-2 space-y-2">
          <textarea
            className="input min-h-[90px]"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          {err && <div className="text-sm text-red-600">{err}</div>}
          <div className="flex gap-2">
            <button className="btn btn-primary" onClick={save} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              className="btn"
              onClick={() => {
                setErr(null);
                setContent(note.content);
                setEditing(false);
              }}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {!editing && (
        <div className="mt-2 flex gap-2">
          <button className="btn" onClick={() => setEditing(true)}>Edit</button>
          <button className="btn text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => onDelete(note.id)}>Delete</button>
        </div>
      )}
    </div>
  );
}
