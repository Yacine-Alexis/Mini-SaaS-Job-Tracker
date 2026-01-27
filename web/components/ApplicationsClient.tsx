"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ApplicationStage } from "@prisma/client";

type AppItem = {
  id: string;
  company: string;
  title: string;
  stage: ApplicationStage;
  location: string | null;
  url: string | null;
  tags: string[];
  appliedDate: string | null;
  updatedAt: string;
};

export default function ApplicationsClient() {
  const [items, setItems] = useState<AppItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [stage, setStage] = useState<ApplicationStage | "">("");
  const [tags, setTags] = useState(""); // comma-separated
  const [from, setFrom] = useState(""); // yyyy-mm-dd (appliedDate from)
  const [to, setTo] = useState("");     // yyyy-mm-dd (appliedDate to)

  const [page, setPage] = useState(1);

  const queryString = useMemo(() => {
    const sp = new URLSearchParams();
    sp.set("page", String(page));
    sp.set("pageSize", "20");
    if (q.trim()) sp.set("q", q.trim());
    if (stage) sp.set("stage", stage);
    if (tags.trim()) sp.set("tags", tags.trim());
    if (from) sp.set("from", new Date(from).toISOString());
    if (to) sp.set("to", new Date(to).toISOString());
    return sp.toString();
  }, [q, stage, tags, from, to, page]);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/applications?${queryString}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setErr(data?.error?.message ?? "Failed to load");
        return;
      }
      setItems(data.items ?? []);
    } catch {
      setErr("Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString]);

  function resetPageAnd<T>(fn: () => T) {
    setPage(1);
    fn();
  }

  const [plan, setPlan] = useState<string | null>(null);
  useEffect(() => {
    fetch("/api/me").then(r => r.json()).then(d => setPlan(d?.user?.plan ?? null)).catch(() => {});
  }, []);
  const isPro = plan === "PRO";


  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Applications</h1>
          <p className="text-sm text-zinc-600">Search, filter, create, edit, and delete your job applications.</p>
        </div>
        <Link className="btn btn-primary" href="/applications/new">New</Link>
      </div>

      <div className="card p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <input
            className="input md:col-span-2"
            placeholder="Search company, title, location…"
            value={q}
            onChange={(e) => resetPageAnd(() => setQ(e.target.value))}
          />
          <select
            className="input"
            value={stage}
            onChange={(e) => resetPageAnd(() => setStage(e.target.value as any))}
          >
            <option value="">All stages</option>
            {Object.values(ApplicationStage).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <input
            className="input"
            placeholder="Tags: remote, referral…"
            value={tags}
            onChange={(e) => resetPageAnd(() => setTags(e.target.value))}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <div className="md:col-span-1">
            <label className="text-xs text-zinc-600">Applied date from</label>
            <input className="input mt-1" type="date" value={from} onChange={(e) => resetPageAnd(() => setFrom(e.target.value))} />
          </div>
          <div className="md:col-span-1">
            <label className="text-xs text-zinc-600">Applied date to</label>
            <input className="input mt-1" type="date" value={to} onChange={(e) => resetPageAnd(() => setTo(e.target.value))} />
          </div>

          <div className="md:col-span-2 flex gap-2 items-end">
            <button className="btn" onClick={() => load()} disabled={loading}>Refresh</button>
            <button
              className="btn"
              onClick={() => {
                setQ(""); setStage(""); setTags(""); setFrom(""); setTo(""); setPage(1);
              }}
              disabled={loading}
            >
              Clear
            </button>
          </div>
          {isPro ? (
            <button
              className="btn"
              onClick={async () => {
                const res = await fetch(`/api/applications/export?${queryString}`);
                if (!res.ok) {
                  const data = await res.json().catch(() => null);
                  alert(data?.error?.message ?? "Export failed");
                  return;
                }
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "applications.csv";
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
              }}
              disabled={loading}
            >
              Export CSV
            </button>
          ) : (
            <a className="btn" href="/settings/billing" title="Upgrade to export CSV">Export (Pro)</a>
          )}
          

        </div>
      </div>

      {loading && <div className="text-sm text-zinc-600">Loading…</div>}
      {err && <div className="text-sm text-red-600">{err}</div>}

      {!loading && !err && items.length === 0 && (
        <div className="card p-6">
          <div className="font-semibold">No applications found</div>
          <p className="mt-1 text-sm text-zinc-600">Try adjusting filters or create a new application.</p>
          <Link className="btn btn-primary mt-4 inline-flex" href="/applications/new">Create one</Link>
        </div>
      )}

      {!loading && !err && items.length > 0 && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 border-b">
              <tr className="text-left">
                <th className="p-3">Company</th>
                <th className="p-3">Title</th>
                <th className="p-3">Stage</th>
                <th className="p-3">Updated</th>
                <th className="p-3 w-[220px]"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className="border-b last:border-b-0">
                  <td className="p-3 font-medium">
                    <Link className="underline" href={`/applications/${it.id}`}>{it.company}</Link>
                  </td>
                  <td className="p-3 text-zinc-700">{it.title}</td>
                  <td className="p-3">
                    <span className="badge">{it.stage}</span>
                  </td>
                  <td className="p-3 text-zinc-600">{new Date(it.updatedAt).toLocaleString()}</td>
                  <td className="p-3">
                    <div className="flex gap-2 justify-end">
                      <Link className="btn" href={`/applications/${it.id}`}>View</Link>
                      <Link className="btn" href={`/applications/${it.id}/edit`}>Edit</Link>
                      <DeleteButton id={it.id} onDone={load} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between">
        <button className="btn" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>
          Prev
        </button>
        <div className="text-sm text-zinc-600">Page {page}</div>
        <button className="btn" disabled={loading || items.length < 20} onClick={() => setPage((p) => p + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}

function DeleteButton({ id, onDone }: { id: string; onDone: () => void }) {
  const [loading, setLoading] = useState(false);

  async function onDelete() {
    if (!confirm("Delete this application?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/applications/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) alert(data?.error?.message ?? "Delete failed");
      else onDone();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button className="btn" onClick={onDelete} disabled={loading}>
      {loading ? "Deleting…" : "Delete"}
    </button>
  );
}
