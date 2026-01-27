"use client";

import { useEffect, useState } from "react";

type Note = {
  id: string;
  content: string;
  createdAt: string;
};

export default function NotesPanel({ applicationId }: { applicationId: string }) {
  const [items, setItems] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
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
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId]);

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

  async function deleteNote(id: string) {
    if (!confirm("Delete this note?")) return;
    const res = await fetch(`/api/notes?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) setErr(data?.error?.message ?? "Delete failed");
    else await load();
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
          placeholder="Add a note…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button className="btn btn-primary" onClick={addNote} disabled={saving || !draft.trim()}>
          {saving ? "Adding…" : "Add note"}
        </button>
      </div>

      {loading && <div className="text-sm text-zinc-600">Loading…</div>}
      {err && <div className="text-sm text-red-600">{err}</div>}

      {!loading && !err && items.length === 0 && (
        <div className="text-sm text-zinc-600">No notes yet.</div>
      )}

      <div className="space-y-2">
        {items.map((n) => (
          <NoteRow key={n.id} note={n} onDelete={deleteNote} onChanged={load} />
        ))}
      </div>
    </div>
  );
}

function NoteRow({
  note,
  onDelete,
  onChanged
}: {
  note: Note;
  onDelete: (id: string) => Promise<void>;
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
    <div className="rounded-lg border border-zinc-200 p-3">
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
              {saving ? "Saving…" : "Save"}
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
          <button className="btn" onClick={() => onDelete(note.id)}>Delete</button>
        </div>
      )}
    </div>
  );
}
