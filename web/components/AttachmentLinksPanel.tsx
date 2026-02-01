"use client";

import { useEffect, useState } from "react";
import { ConfirmModal } from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";

type LinkItem = {
  id: string;
  label: string | null;
  url: string;
  createdAt: string;
};

function LinksSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2].map((i) => (
        <div key={i} className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-3">
          <Skeleton className="h-3 w-20 mb-2" />
          <Skeleton className="h-4 w-24 mb-1" />
          <Skeleton className="h-3 w-48" />
        </div>
      ))}
    </div>
  );
}

export default function AttachmentLinksPanel({ applicationId }: { applicationId: string }) {
  const [items, setItems] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/attachment-links?applicationId=${encodeURIComponent(applicationId)}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setErr(data?.error?.message ?? "Failed to load links");
        return;
      }
      setItems(data.items ?? []);
    } catch {
      setErr("Failed to load links");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId]);

  async function add() {
    if (!url.trim()) return;
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch("/api/attachment-links", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          applicationId,
          label: label.trim() ? label.trim() : null,
          url: url.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data?.error?.message ?? "Create failed");
        return;
      }
      setLabel("");
      setUrl("");
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/attachment-links?id=${encodeURIComponent(deleteId)}`, { method: "DELETE" });
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
        <h2 className="font-semibold">Attachment links</h2>
        <button className="btn" onClick={load} disabled={loading}>Refresh</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <input className="input" placeholder="Label (optional)" value={label} onChange={(e) => setLabel(e.target.value)} />
        <input 
          className="input" 
          placeholder="https://…" 
          value={url} 
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && url.trim()) {
              e.preventDefault();
              add();
            }
          }}
        />
        <button className="btn btn-primary md:col-span-2" onClick={add} disabled={saving || !url.trim()}>
          {saving ? "Adding…" : "Add link"}
        </button>
      </div>

      {err && <div className="text-sm text-red-600">{err}</div>}

      {loading ? (
        <LinksSkeleton />
      ) : items.length === 0 ? (
        <EmptyState
          icon="links"
          title="No links yet"
          description="Add links to resumes, portfolios, job postings, or other relevant documents."
        />
      ) : (
        <div className="space-y-2">
          {items.map((l) => (
            <LinkRow key={l.id} item={l} onChanged={load} onDelete={(id) => setDeleteId(id)} />
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete link"
        message="Are you sure you want to delete this link? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}

function LinkRow({
  item,
  onChanged,
  onDelete
}: {
  item: LinkItem;
  onChanged: () => Promise<void>;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(item.label ?? "");
  const [url, setUrl] = useState(item.url);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setLabel(item.label ?? "");
    setUrl(item.url);
  }, [item.label, item.url]);

  async function save() {
    if (!url.trim()) { setErr("URL required."); return; }
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch(`/api/attachment-links?id=${encodeURIComponent(item.id)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          label: label.trim() ? label.trim() : null,
          url: url.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) { setErr(data?.error?.message ?? "Update failed"); return; }
      setEditing(false);
      await onChanged();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-3">
      <div className="text-xs text-zinc-500">{new Date(item.createdAt).toLocaleString()}</div>

      {!editing ? (
        <>
          <div className="mt-1 text-sm font-medium">{item.label ?? "Link"}</div>
          <div className="mt-1 text-sm">
            <a className="underline break-all text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300" href={item.url} target="_blank" rel="noreferrer">
              {item.url}
            </a>
          </div>
          <div className="mt-2 flex gap-2">
            <button className="btn text-xs" onClick={() => setEditing(true)}>Edit</button>
            <button className="btn text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => onDelete(item.id)}>Delete</button>
          </div>
        </>
      ) : (
        <div className="mt-2 space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <input className="input" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label" />
            <input className="input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
          </div>
          {err && <div className="text-sm text-red-600">{err}</div>}
          <div className="flex gap-2">
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
            <button className="btn" onClick={() => { setEditing(false); setErr(null); }} disabled={saving}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
