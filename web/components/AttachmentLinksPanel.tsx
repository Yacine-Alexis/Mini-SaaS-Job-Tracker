"use client";

import { useEffect, useState } from "react";

type LinkItem = {
  id: string;
  label: string | null;
  url: string;
  createdAt: string;
};

export default function AttachmentLinksPanel({ applicationId }: { applicationId: string }) {
  const [items, setItems] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);

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

  async function del(id: string) {
    if (!confirm("Delete this link?")) return;
    const res = await fetch(`/api/attachment-links?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) setErr(data?.error?.message ?? "Delete failed");
    else await load();
  }

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Attachment links</h2>
        <button className="btn" onClick={load} disabled={loading}>Refresh</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <input className="input" placeholder="Label (optional)" value={label} onChange={(e) => setLabel(e.target.value)} />
        <input className="input" placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} />
        <button className="btn btn-primary md:col-span-2" onClick={add} disabled={saving || !url.trim()}>
          {saving ? "Adding…" : "Add link"}
        </button>
      </div>

      {loading && <div className="text-sm text-zinc-600">Loading…</div>}
      {err && <div className="text-sm text-red-600">{err}</div>}

      {!loading && !err && items.length === 0 && (
        <div className="text-sm text-zinc-600">No links yet.</div>
      )}

      <div className="space-y-2">
        {items.map((l) => (
          <LinkRow key={l.id} item={l} onChanged={load} onDelete={del} />
        ))}
      </div>
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
  onDelete: (id: string) => Promise<void>;
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
    <div className="rounded-lg border border-zinc-200 p-3">
      <div className="text-xs text-zinc-500">{new Date(item.createdAt).toLocaleString()}</div>

      {!editing ? (
        <>
          <div className="mt-1 text-sm font-medium">{item.label ?? "Link"}</div>
          <div className="mt-1 text-sm">
            <a className="underline break-all" href={item.url} target="_blank" rel="noreferrer">
              {item.url}
            </a>
          </div>
          <div className="mt-2 flex gap-2">
            <button className="btn" onClick={() => setEditing(true)}>Edit</button>
            <button className="btn" onClick={() => onDelete(item.id)}>Delete</button>
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
